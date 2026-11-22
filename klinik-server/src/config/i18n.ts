import i18next from 'i18next'
import middleware from 'i18next-http-middleware'
import en from '../locales/en.json'
import de from '../locales/de.json'

i18next.use(middleware.LanguageDetector).init({
  fallbackLng: 'en',
  supportedLngs: ['en', 'de'],
  preload: ['en', 'de'],
  resources: {
    en: { translation: en },
    de: { translation: de },
  },
  detection: {
    order: ['header', 'querystring'],
    lookupHeader: 'accept-language',
    lookupQuerystring: 'lang',
    caches: false,
  },
  interpolation: {
    escapeValue: false,
  },
})

export default i18next
export const i18nMiddleware = middleware.handle(i18next)
