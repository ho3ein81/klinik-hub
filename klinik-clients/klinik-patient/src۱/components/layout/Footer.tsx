'use client';

import { useTranslations } from 'next-intl';
import { Mail, MapPin, Phone } from 'lucide-react';
import type { Clinic, ClinicContact } from '@/types/domain';

interface FooterProps {
  /**
   * Passed in from the server-rendered page. The footer carries the clinic's
   * address and phone number on every page that renders it, which is a large
   * part of what search engines read as the practice's location — so it must
   * not depend on a browser fetch.
   */
  clinic: Clinic | null;
  contacts: ClinicContact[];
}

export function Footer({ clinic, contacts }: FooterProps) {
  const t = useTranslations('nav');
  const tHome = useTranslations('home');
  const year = new Date().getFullYear();

  const hasContactInfo = Boolean(clinic?.address) || contacts.length > 0;

  return (
    <footer className="border-t border-border bg-surface-card">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2">
          {/* Brand */}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-subtle">
                <svg
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-surface-card"
                >
                  <path
                    d="M32 16V48M16 32H48"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="min-w-0 text-base font-bold tracking-tight text-text-main [overflow-wrap:anywhere]">
                {clinic?.name || tHome('heroLabel')}
              </span>
            </div>
            {clinic?.description && (
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-text-muted [overflow-wrap:anywhere]">
                {clinic.description}
              </p>
            )}
          </div>

          {/* Contact */}
          {hasContactInfo && (
            <div className="min-w-0">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-dimmed">
                {tHome('contact')}
              </h3>
              <div className="mt-3 flex flex-col gap-2.5">
                {clinic?.address && (
                  <span className="flex min-w-0 items-start gap-2 text-sm text-text-muted">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 [overflow-wrap:anywhere]">{clinic.address}</span>
                  </span>
                )}
                {contacts.map((contact) => (
                  <span
                    key={contact.id}
                    className="flex min-w-0 items-start gap-2 text-sm text-text-muted"
                  >
                    {contact.contactType === 'EMAIL' ? (
                      <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    )}
                    <span dir="auto" className="min-w-0 [overflow-wrap:anywhere]">
                      {contact.value}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 break-words border-t border-border pt-6 text-center text-xs text-text-muted">
          © {year} {clinic?.name ? `${clinic.name}. ` : ''}{t('allRightsReserved')}
        </div>
      </div>
    </footer>
  );
}
