import type { MetadataRoute } from 'next'
import { absoluteUrl } from '@/config/site.config'
import { routing } from '@/i18n/routing'
import { getClinicSetting, listArticles, listServices } from '@/services'

// Built per request for the same reason as the home page: a sitemap frozen at
// build time would list only what the API returned during the image build.
export const dynamic = 'force-dynamic'
export const fetchCache = 'default-cache'

/** One sitemap entry per locale for the same page, cross-linked with hreflang. */
function entry(
  path: string,
  lastModified: string | Date | undefined,
  priority: number,
): MetadataRoute.Sitemap {
  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((locale) => [locale, absoluteUrl(`/${locale}${path}`)]),
  )
  // Which version to serve a searcher whose language matches neither: German,
  // the clinic's own language. Mirrors the x-default link in the page head.
  languages['x-default'] = absoluteUrl(`/${routing.defaultLocale}${path}`)

  return routing.locales.map((locale) => ({
    url: absoluteUrl(`/${locale}${path}`),
    ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
    changeFrequency: path === '' ? ('weekly' as const) : ('monthly' as const),
    priority,
    alternates: { languages },
  }))
}

/**
 * Served at /sitemap.xml — the list of URLs Google should crawl, with the date
 * each one last changed so a recrawl is cheap. Built from the live API, so a
 * service or article added in the dashboard appears without a deploy (within the
 * revalidation window).
 *
 * Doctors are not listed: they have no page of their own, they are part of the
 * home page.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [servicesResult, articlesResult, settingResult] = await Promise.allSettled([
    listServices({ limit: 100 }),
    listArticles({ limit: 100 }),
    getClinicSetting(),
  ])

  const services = servicesResult.status === 'fulfilled' ? servicesResult.value.data : []
  const articles = articlesResult.status === 'fulfilled' ? articlesResult.value.data : []
  // Articles hidden in the dashboard are not linked from anywhere, so they do
  // not belong in the sitemap either.
  const showArticles =
    settingResult.status === 'fulfilled' ? settingResult.value.showArticle : true

  const newest = (dates: string[]): string | undefined =>
    dates.length ? dates.slice().sort().at(-1) : undefined

  return [
    // The home page carries the clinic, the doctors, the services and the
    // contact details, so its freshness tracks whatever changed most recently.
    ...entry('', newest([...services, ...articles].map((item) => item.updatedAt)), 1),
    ...services.flatMap((service) =>
      entry(`/services/${service.id}`, service.updatedAt, 0.8),
    ),
    ...(showArticles
      ? articles.flatMap((article) =>
          entry(`/articles/${article.id}`, article.updatedAt, 0.6),
        )
      : []),
  ]
}
