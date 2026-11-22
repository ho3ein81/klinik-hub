import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { HomeView } from './home-view';
import { JsonLd } from '@/components/seo/JsonLd';
import { alternatesFor, clinicJsonLd, truncate } from '@/lib/seo';
import {
  clinicImageUrl,
  getClinic,
  getClinicSetting,
  listArticles,
  listClinicContacts,
  listDoctors,
  listServices,
  listStaff,
} from '@/services';
import type {
  Article,
  Clinic,
  ClinicContact,
  Doctor,
  Service,
  StaffMember,
} from '@/types/domain';

/**
 * Rendered per request rather than at build time. Staff edit this content in the
 * dashboard, so a page baked into the image would serve whatever the API
 * happened to return during `docker build` — including nothing at all on a first
 * deployment, when the clinic does not exist yet. `fetchCache` keeps the API
 * calls themselves cached for the five minutes `api-client` asks for, so a crawl
 * costs one round trip per endpoint, not one per URL.
 */
export const dynamic = 'force-dynamic';
export const fetchCache = 'default-cache';

/**
 * The seven public datasets the page shows. Every call is unauthenticated, and
 * `Promise.allSettled` keeps one failing endpoint from blanking the whole page —
 * the same tolerance the old browser-side fetch had.
 *
 * Next.js dedupes identical fetches within a render, so calling this from both
 * `generateMetadata` and the page itself does not double the API traffic.
 */
async function loadHomeData(): Promise<{
  clinic: Clinic | null;
  services: Service[];
  doctors: Doctor[];
  staff: StaffMember[];
  contacts: ClinicContact[];
  articles: Article[];
  bookingAllowed: boolean;
  showArticles: boolean;
}> {
  const [clinic, services, doctors, staff, contacts, setting, articles] =
    await Promise.allSettled([
      getClinic(),
      listServices({ limit: 50 }),
      listDoctors({ limit: 50 }),
      listStaff({ limit: 50 }),
      listClinicContacts({ limit: 50 }),
      getClinicSetting(),
      listArticles({ limit: 50 }),
    ]);

  return {
    clinic: clinic.status === 'fulfilled' ? clinic.value : null,
    services: services.status === 'fulfilled' ? services.value.data : [],
    doctors: doctors.status === 'fulfilled' ? doctors.value.data : [],
    staff: staff.status === 'fulfilled' ? staff.value.data : [],
    contacts: contacts.status === 'fulfilled' ? contacts.value.data : [],
    articles: articles.status === 'fulfilled' ? articles.value.data : [],
    bookingAllowed:
      setting.status === 'fulfilled' ? setting.value.allowPatientBooking : true,
    showArticles: setting.status === 'fulfilled' ? setting.value.showArticle : true,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const clinic = await getClinic().catch(() => null);

  // The home page is what someone searching for the practice by name should
  // find, so its title leads with the clinic's own name and says what it is.
  const title = clinic
    ? `${clinic.name}${clinic.address ? ` — ${clinic.address}` : ''}`
    : t('heroTitle');
  const description = truncate(clinic?.description || t('heroSubtitle'));

  return {
    title,
    description,
    alternates: alternatesFor(locale),
    openGraph: {
      title,
      description,
      url: alternatesFor(locale)?.canonical as string,
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const data = await loadHomeData();

  return (
    <>
      {/* Describes the practice — name, address, phone, doctors, services — in
          the vocabulary Google reads for local and business results. */}
      <JsonLd
        data={clinicJsonLd({
          clinic: data.clinic,
          contacts: data.contacts,
          doctors: data.doctors,
          staff: data.staff,
          services: data.services,
          locale,
          clinicImageUrl: data.clinic?.image
            ? clinicImageUrl(data.clinic.image)
            : null,
        })}
      />
      <HomeView {...data} />
    </>
  );
}
