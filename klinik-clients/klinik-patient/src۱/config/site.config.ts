/**
 * Public identity of this deployment, used for canonical URLs, sitemap entries,
 * Open Graph tags and structured data. Everything here is baked into the bundle
 * at build time, so changing one of these values needs
 * `docker compose ... up -d --build patient`, not a restart.
 */

/**
 * The origin the site is served from, without a trailing slash — e.g.
 * `https://praxis-yazdani.ch`. Search engines need absolute URLs: a canonical
 * or sitemap entry has no meaning relative to the page it sits on.
 *
 * The localhost fallback keeps `next build` and local runs working; on a public
 * deployment it must be set, or Google is told the canonical page lives on
 * localhost.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'
).replace(/\/+$/, '')

/**
 * Value for Google Search Console's HTML-tag verification method. Optional —
 * DNS verification needs no code at all, and once the site is verified the tag
 * can stay or go.
 */
export const GOOGLE_SITE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined

/** Absolute URL for a path like `/de-CH/services/<id>`. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
