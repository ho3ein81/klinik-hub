'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft, Clock } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { PublicImage } from '@/components/ui/PublicImage';
import { serviceImageUrl } from '@/services';
import type { Service } from '@/types/domain';

/** Presentation only — the service is fetched by the server component. */
export function ServiceView({ service }: { service: Service }) {
  const t = useTranslations('serviceDetail');
  const tHome = useTranslations('home');

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/#services"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backHome')}
      </Link>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface-card shadow-subtle">
        <div className="h-56 w-full overflow-hidden bg-surface-bg sm:h-72">
          <PublicImage
            url={service.image ? serviceImageUrl(service.image, 'm') : null}
            alt={service.name}
            className="h-full w-full"
          />
        </div>
        <div className="p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-text-main sm:text-3xl">
            {service.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text-muted">
            {service.price !== null && (
              <span className="font-semibold text-text-main">
                {tHome('currency')} {service.price.toFixed(2)}
              </span>
            )}
            {service.duration !== null && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                {service.duration} {t('minutes')}
              </span>
            )}
          </div>

          {service.description && (
            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-text-muted">
              {service.description}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
