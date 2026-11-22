import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { ArticleView } from './article-view';
import { JsonLd } from '@/components/seo/JsonLd';
import { alternatesFor, articleJsonLd, stripHtml, truncate } from '@/lib/seo';
import { articleImageUrl, getArticle, getClinic } from '@/services';
import type { Article } from '@/types/domain';

async function loadArticle(id: string): Promise<Article | null> {
  // The API serves only PUBLISHED articles here, so an unpublished one 404s and
  // is treated exactly like a missing one.
  return getArticle(id).catch(() => null);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const article = await loadArticle(id);

  if (!article) return { robots: { index: false, follow: false } };

  const description = truncate(stripHtml(article.content));

  return {
    title: article.title,
    description,
    alternates: alternatesFor(locale, `/articles/${id}`),
    openGraph: {
      type: 'article',
      title: article.title,
      description,
      url: alternatesFor(locale, `/articles/${id}`)?.canonical as string,
      publishedTime: article.createdAt,
      modifiedTime: article.updatedAt,
      ...(article.image
        ? { images: [{ url: articleImageUrl(article.image), alt: article.title }] }
        : {}),
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [article, clinic] = await Promise.all([
    loadArticle(id),
    getClinic().catch(() => null),
  ]);

  if (!article) notFound();

  return (
    <>
      <JsonLd
        data={articleJsonLd({
          article,
          clinic,
          locale,
          imageUrl: article.image ? articleImageUrl(article.image) : null,
        })}
      />
      <ArticleView article={article} />
    </>
  );
}
