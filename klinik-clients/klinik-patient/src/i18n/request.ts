import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale

  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  let messages = {}
  try {
    messages = (await import(`../../messages/${locale}.json`)).default
  } catch (error) {
    console.error(
      `[i18n] Failed to load messages for locale: "${locale}"`,
      error,
    )
    messages = {}
  }

  return {
    locale,
    messages,
  }
})
