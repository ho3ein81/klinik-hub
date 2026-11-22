'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';

export default function AuthPage() {
  const t = useTranslations('auth');

  const Logo = (
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-tint text-primary shadow-subtle">
      <svg
        className="h-7 w-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    </div>
  );

  return (
    <AuthLayout logo={Logo} title={t('login.title')} subtitle={t('login.subtitle')}>
      <LoginForm />
    </AuthLayout>
  );
}
