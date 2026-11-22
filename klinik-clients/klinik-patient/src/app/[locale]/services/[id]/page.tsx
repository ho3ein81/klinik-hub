import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { ServiceView } from './service-view';
import { JsonLd } from '@/components/seo/JsonLd';
import { alternatesFor, serviceJsonLd, truncate } from '@/lib/seo';
import { getClinic, getService, serviceImageUrl } from '@/services';
import type { Service } from '@/types/domain';

async function loadService(id: string): Promise<Service | null> {
  return getService(id).catch(() => null);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const service = await loadService(id);

  // A page that no longer exists must not advertise itself; `notFound()` in the
  // page below answers 404, and this keeps the metadata consistent with that.
  if (!service) return { robots: { index: false, follow: false } };

  const description = truncate(
    service.description ||
      [
        service.name,
        service.duration ? `${service.duration} min` : null,
      ]
        .filter(Boolean)
        .join(' · '),
  );

  return {
    title: service.name,
    description,
    alternates: alternatesFor(locale, `/services/${id}`),
    openGraph: {
      type: 'article',
      title: service.name,
      description,
      url: alternatesFor(locale, `/services/${id}`)?.canonical as string,
      ...(service.image
        ? { images: [{ url: serviceImageUrl(service.image), alt: service.name }] }
        : {}),
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [service, clinic] = await Promise.all([
    loadService(id),
    getClinic().catch(() => null),
  ]);

  // A real 404 rather than a 200 page saying "not found" — a soft 404 gets the
  // URL indexed as a valid page and reported as an error in Search Console.
  if (!service) notFound();

  return (
    <>
      <JsonLd
        data={serviceJsonLd({
          service,
          clinic,
          locale,
          imageUrl: service.image ? serviceImageUrl(service.image) : null,
        })}
      />
      <ServiceView service={service} />
    </>
  );
}
