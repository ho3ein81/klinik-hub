import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/layout/AuthGuard';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const resolvedParams = await params;
  const { locale } = resolvedParams;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
