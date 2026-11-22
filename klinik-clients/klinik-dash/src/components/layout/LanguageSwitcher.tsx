'use client';

import React from 'react';
import type { Route } from 'next';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';

const locales = ['de-CH', 'en'] as const;

type Locale = (typeof locales)[number];

export const LanguageSwitcher = () => {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === currentLocale) {
      return;
    }

    const segments = pathname.split('/');


    segments[1] = newLocale;

    const localizedPath = (segments.join('/') || `/${newLocale}`) as Route;

    router.replace(localizedPath);
  };

  return (
    <div className="flex rounded-full border border-border bg-surface-bg p-1">
      <button
        type="button"
        onClick={() => switchLocale('de-CH')}
        aria-pressed={currentLocale === 'de-CH'}
        className={`flex-1 rounded-full py-1 text-xs font-semibold transition-all ${currentLocale === 'de-CH'
          ? 'bg-primary text-white shadow-subtle'
          : 'text-text-muted hover:text-text-main'
          }`}
      >
        DE-CH
      </button>

      <button
        type="button"
        onClick={() => switchLocale('en')}
        aria-pressed={currentLocale === 'en'}
        className={`flex-1 rounded-full py-1 text-xs font-semibold transition-all ${currentLocale === 'en'
          ? 'bg-primary text-white shadow-subtle'
          : 'text-text-muted hover:text-text-main'
          }`}
      >
        EN
      </button>
    </div>
  );
};
