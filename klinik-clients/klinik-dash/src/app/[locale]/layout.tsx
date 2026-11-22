import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import '../globals.css';

// SVG لوپ‌بک با کیفیت بالا برای آیکون تب مرورگر (تضمین لود آنی و بدون مشکل کش)
const faviconSvg = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%">
  <rect width="64" height="64" rx="16" fill="#424298" />
  <path d="M32 16v32M16 32h32" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
</svg>
`)}`;

export const metadata: Metadata = {
  title: {
    default: 'Clinic Management',
    template: '%s | Clinic Management',
  },
  description: 'Swiss-Minimal Clinic Management Dashboard',
  icons: {
    icon: [
      {
        url: faviconSvg,
        type: 'image/svg+xml',
      },
      {
        url: '/icon.png',
        sizes: '96x96',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
};

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

  // اعتبارسنجی لوکال ورودی با لیست مجاز در routing
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir="ltr"
      suppressHydrationWarning
      translate="no"
    >
      <body className="bg-surface-bg text-text-main font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
