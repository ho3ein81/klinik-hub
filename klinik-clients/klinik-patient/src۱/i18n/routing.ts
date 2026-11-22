import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

export const routing = defineRouting({
  locales: ['de-CH', 'en'],
  defaultLocale: 'de-CH',
  // Always open in German rather than negotiating from Accept-Language.
  // With detection on, an English-configured browser would still land on
  // /en and the German default would never be visible. Visitors can still
  // switch with the language switcher, and /en/... links keep working.
  localeDetection: false,
})

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing)
