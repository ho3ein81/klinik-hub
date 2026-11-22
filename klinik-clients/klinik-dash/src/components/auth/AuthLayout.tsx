'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

interface AuthLayoutProps {
  logo: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  logo,
  title,
  subtitle,
  children,
}) => {
  const tCommon = useTranslations('common');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-surface-bg relative">

      <aside className="absolute top-6 right-6 z-10">
        <LanguageSwitcher />
      </aside>


      <div className="w-full max-w-lg px-8 py-10 bg-surface-card shadow-subtle rounded-2xl border border-border">
        <div className="text-center mb-10">
          {logo}
          <h1 className="text-2xl font-bold text-text-main mt-4 tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-text-muted mt-2">{subtitle}</p>
        </div>

        <div className="flex flex-col items-center w-full">{children}</div>
      </div>

      <footer className="mt-8 text-xs text-text-dimmed">
        © {new Date().getFullYear()} Nān Klinik. {tCommon('allRightsReserved')}
      </footer>
    </div>
  );
};
