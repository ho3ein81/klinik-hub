'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { PublicImage } from '@/components/ui/PublicImage';
import { formatDate } from '@/lib/utils';
import { articleImageUrl } from '@/services';
import type { Article } from '@/types/domain';

/** Presentation only — the article is fetched by the server component. */
export function ArticleView({ article }: { article: Article }) {
  const t = useTranslations('articleDetail');
  const locale = useLocale();

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/#articles"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backHome')}
      </Link>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface-card shadow-subtle">
        <div className="h-56 w-full overflow-hidden bg-surface-bg sm:h-72">
          <PublicImage
            url={article.image ? articleImageUrl(article.image, 'm') : null}
            alt={article.title}
            className="h-full w-full"
          />
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-xs text-text-dimmed">{formatDate(article.createdAt, locale)}</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-text-main [overflow-wrap:anywhere] sm:text-3xl">
            {article.title}
          </h1>
          {/* Article bodies are author-supplied HTML, so the media and layout
              elements inside need constraining or a wide image, table or bare
              URL scrolls the page sideways on a phone. */}
          <div
            className="prose prose-sm mt-6 max-w-none break-words text-text-muted [&_a]:text-primary [&_a]:underline [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-text-main [&_img]:h-auto [&_img]:max-w-full [&_p]:mb-4 [&_pre]:overflow-x-auto [&_strong]:font-semibold [&_strong]:text-text-main [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>
      </div>
    </article>
  );
}
