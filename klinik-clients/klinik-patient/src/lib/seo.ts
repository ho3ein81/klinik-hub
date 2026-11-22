import { SITE_URL, absoluteUrl } from '@/config/site.config'
import { routing } from '@/i18n/routing'
import type { Metadata } from 'next'
import type {
  Article,
  Clinic,
  ClinicContact,
  Doctor,
  Service,
  StaffMember,
} from '@/types/domain'

/* ── Text helpers ─────────────────────────────────────────────────────────── */

/** Article bodies are author-supplied HTML; meta descriptions must be plain text. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Google renders roughly 155-160 characters of a description. Cut on a word
 * boundary so the snippet doesn't end mid-word.
 */
export function truncate(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

/* ── Canonical + hreflang ─────────────────────────────────────────────────── */

/**
 * Canonical URL plus one hreflang entry per locale for the same page.
 *
 * `path` is the route *without* the locale segment (`''` for the home page,
 * `/services/<id>` for a service). Every locale is indexed; `x-default` points
 * at German, which is both the default locale and the language the clinic's own
 * content is written in.
 */
export function alternatesFor(locale: string, path = ''): Metadata['alternates'] {
  const languages: Record<string, string> = {}
  for (const loc of routing.locales) {
    languages[loc] = absoluteUrl(`/${loc}${path}`)
  }
  languages['x-default'] = absoluteUrl(`/${routing.defaultLocale}${path}`)

  return {
    canonical: absoluteUrl(`/${locale}${path}`),
    languages,
  }
}

/* ── Structured data (schema.org / JSON-LD) ───────────────────────────────── */

type JsonLdObject = Record<string, unknown>

function primaryContactOfType(
  contacts: ClinicContact[],
  contactType: 'EMAIL' | 'PHONE',
): string | undefined {
  const matching = contacts.filter((c) => c.contactType === contactType)
  return (matching.find((c) => c.isPrimary) ?? matching[0])?.value
}

/** Stable @id for the practice, so other nodes can reference the same entity. */
function clinicId(): string {
  return `${SITE_URL}/#clinic`
}

/**
 * The practice itself, as a `Dentist` — a LocalBusiness subtype Google
 * recognises for local results. `address` is emitted as a plain string because
 * that is all the API holds; adding street/postalCode/city/geo later turns this
 * into a full PostalAddress and is what unlocks the map-pin treatment.
 */
export function clinicJsonLd(params: {
  clinic: Clinic | null
  contacts: ClinicContact[]
  doctors: Doctor[]
  staff: StaffMember[]
  services: Service[]
  locale: string
  clinicImageUrl: string | null
}): JsonLdObject | null {
  const { clinic, contacts, doctors, services, locale, clinicImageUrl } = params
  if (!clinic) return null

  const telephone = primaryContactOfType(contacts, 'PHONE')
  const email = primaryContactOfType(contacts, 'EMAIL')

  return {
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    '@id': clinicId(),
    name: clinic.name,
    url: absoluteUrl(`/${locale}`),
    ...(clinic.description ? { description: clinic.description } : {}),
    ...(clinic.address ? { address: clinic.address } : {}),
    ...(telephone ? { telephone } : {}),
    ...(email ? { email } : {}),
    ...(clinicImageUrl ? { image: clinicImageUrl } : {}),
    ...(doctors.length
      ? {
          employee: doctors.map((doctor) => ({
            '@type': 'Physician',
            name: `${doctor.firstName} ${doctor.lastName}`.trim(),
            ...(doctor.specialties.length
              ? { medicalSpecialty: doctor.specialties.map((s) => s.name) }
              : {}),
          })),
        }
      : {}),
    ...(services.length
      ? {
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: clinic.name,
            itemListElement: services.map((service) => ({
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: service.name,
                ...(service.description
                  ? { description: service.description }
                  : {}),
                url: absoluteUrl(`/${locale}/services/${service.id}`),
              },
              ...(service.price !== null
                ? { price: service.price, priceCurrency: 'CHF' }
                : {}),
            })),
          },
        }
      : {}),
  }
}

export function serviceJsonLd(params: {
  service: Service
  clinic: Clinic | null
  locale: string
  imageUrl: string | null
}): JsonLdObject {
  const { service, clinic, locale, imageUrl } = params
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    url: absoluteUrl(`/${locale}/services/${service.id}`),
    ...(service.description ? { description: service.description } : {}),
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(clinic
      ? {
          provider: {
            '@type': 'Dentist',
            '@id': clinicId(),
            name: clinic.name,
            ...(clinic.address ? { address: clinic.address } : {}),
          },
        }
      : {}),
    ...(service.price !== null
      ? {
          offers: {
            '@type': 'Offer',
            price: service.price,
            priceCurrency: 'CHF',
          },
        }
      : {}),
  }
}

export function articleJsonLd(params: {
  article: Article
  clinic: Clinic | null
  locale: string
  imageUrl: string | null
}): JsonLdObject {
  const { article, clinic, locale, imageUrl } = params
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: truncate(article.title, 110),
    url: absoluteUrl(`/${locale}/articles/${article.id}`),
    datePublished: article.createdAt,
    dateModified: article.updatedAt,
    inLanguage: locale,
    description: truncate(stripHtml(article.content)),
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(clinic
      ? {
          author: { '@type': 'Organization', name: clinic.name },
          publisher: {
            '@type': 'Dentist',
            '@id': clinicId(),
            name: clinic.name,
          },
        }
      : {}),
  }
}
