import type { MetadataRoute } from 'next'
import { SITE_URL, absoluteUrl } from '@/config/site.config'

/**
 * Served at /robots.txt. Lives outside the `[locale]` segment on purpose, and
 * the next-intl middleware ignores it because its matcher skips any path
 * containing a dot.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // The patient account area is behind a login and has nothing to index;
        // both the prefixed and unprefixed forms are covered.
        disallow: ['/patient', '/*/patient'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  }
}
