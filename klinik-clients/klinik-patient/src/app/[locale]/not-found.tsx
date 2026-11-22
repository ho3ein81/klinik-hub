'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import EmptyState from '@/components/ui/EmptyState';

/**
 * Rendered whenever a page in this segment calls `notFound()` — a service or
 * article id that no longer resolves. Being a real boundary means the response
 * carries HTTP 404 instead of a 200 page that merely says "not found", which is
 * what keeps dead URLs out of the index.
 *
 * A client component so it can use the messages the layout's provider already
 * holds; `not-found.tsx` receives no params of its own.
 */
export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <EmptyState message={t('title')} hint={t('hint')} />
      <div className="mt-6 flex justify-center">
        <Link
          href="/"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:text-text-main"
        >
          {t('backHome')}
        </Link>
      </div>
    </div>
  );
}
