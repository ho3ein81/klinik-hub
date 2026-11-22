import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Header } from '@/components/layout/Header';
import { GOOGLE_SITE_VERIFICATION, SITE_URL } from '@/config/site.config';
import { alternatesFor, truncate } from '@/lib/seo';
import { getClinic, getClinicSetting, clinicImageUrl } from '@/services';
import '../globals.css';

const faviconSvg = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%">
  <rect width="64" height="64" rx="16" fill="#424298" />
  <path d="M32 16v32M16 32h32" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
</svg>
`)}`;

/**
 * Fetched on the server so the clinic's own name — not "KlinikHub" — is the
 * title of every page, in search results and in the browser tab. Falls back to
 * the generic strings when the API is unreachable, so a slow API degrades the
 * page's metadata rather than breaking the page.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });

  const clinic = await getClinic().catch(() => null);
  const name = clinic?.name ?? 'KlinikHub';
  const description = truncate(clinic?.description || t('heroSubtitle'));
  const image = clinic?.image ? clinicImageUrl(clinic.image) : null;

  return {
    // Required for canonical/Open Graph URLs to come out absolute.
    metadataBase: new URL(SITE_URL),
    title: {
      // Pages that set their own title get "<page> | <clinic>"; the home page
      // overrides the default outright.
      default: name,
      template: `%s | ${name}`,
    },
    description,
    applicationName: name,
    alternates: alternatesFor(locale),
    openGraph: {
      type: 'website',
      siteName: name,
      locale,
      title: name,
      description,
      url: alternatesFor(locale)?.canonical as string,
      ...(image ? { images: [{ url: image, alt: name }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: name,
      description,
      ...(image ? { images: [image] } : {}),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    icons: {
      icon: [{ url: faviconSvg, type: 'image/svg+xml' }],
    },
    ...(GOOGLE_SITE_VERIFICATION
      ? { verification: { google: GOOGLE_SITE_VERIFICATION } }
      : {}),
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale: string) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  // The header's clinic name and its Articles nav item used to arrive from two
  // browser fetches, which left the name blank in the delivered HTML. Fetching
  // here puts it in every page's markup. allSettled: the chrome must still
  // render if the API is down.
  const [clinicResult, settingResult] = await Promise.allSettled([
    getClinic(),
    getClinicSetting(),
  ]);
  const clinicName =
    clinicResult.status === 'fulfilled' ? clinicResult.value.name : null;
  const showArticles =
    settingResult.status === 'fulfilled' ? settingResult.value.showArticle : true;

  return (
    <html lang={locale} dir="ltr" suppressHydrationWarning translate="no">
      <body className="flex min-h-screen flex-col bg-surface-bg text-text-main font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <Header clinicName={clinicName} showArticles={showArticles} />
          <main className="flex-1">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
