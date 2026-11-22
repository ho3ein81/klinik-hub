'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  CalendarClock,
  Mail,
  MapPin,
  Phone,
  Stethoscope,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PublicImage } from '@/components/ui/PublicImage';
import { Avatar } from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import { BookingModal } from '@/components/booking/BookingModal';
import { DoctorAvailabilityPanel } from '@/components/booking/DoctorAvailabilityPanel';
import { Footer } from '@/components/layout/Footer';
import { fullName } from '@/lib/utils';
import { isAuthenticated } from '@/lib/auth';
import { articleImageUrl, clinicImageUrl, serviceImageUrl } from '@/services';
import type { Article, Clinic, ClinicContact, Doctor, Service, StaffMember } from '@/types/domain';

/* ── Staff role i18n key ──────────────────────────────────────────────── */

const STAFF_ROLE_KEY: Record<string, 'roleNurse' | 'roleReceptionist'> = {
  NURSE: 'roleNurse',
  RECEPTIONIST: 'roleReceptionist',
};

/* ── View ─────────────────────────────────────────────────────────────── */

interface HomeViewProps {
  clinic: Clinic | null;
  services: Service[];
  doctors: Doctor[];
  staff: StaffMember[];
  contacts: ClinicContact[];
  articles: Article[];
  bookingAllowed: boolean;
  showArticles: boolean;
}

/**
 * Everything on this page arrives as props from the server component in
 * `page.tsx`. It used to load itself in a `useEffect`, which meant the HTML
 * delivered to a crawler held no clinic, no doctors and no services — only a
 * spinner. The component is still a client component (the booking modal, the
 * availability panels and the nav all need browser state), and client
 * components are rendered to HTML on the server too, so moving the fetch out
 * was enough to make the content indexable.
 */
export function HomeView({
  clinic,
  services,
  doctors,
  staff,
  contacts,
  articles,
  bookingAllowed,
  showArticles,
}: HomeViewProps) {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');

  const [bookingOpen, setBookingOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [bookingDoctorId, setBookingDoctorId] = useState<string | undefined>(undefined);

  // Reads localStorage, so it can only run in the browser.
  useEffect(() => {
    setLoggedIn(isAuthenticated());
  }, []);

  const primaryContact = contacts.find((c) => c.isPrimary) || null;

  const openBooking = useCallback((doctorId?: string) => {
    setBookingDoctorId(doctorId);
    setBookingOpen(true);
  }, []);

  return (
    <div className="relative">
      {/* ──────────────────── HERO ──────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-surface-card">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:py-24">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {t('heroLabel')}
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-text-main [overflow-wrap:anywhere] sm:text-4xl lg:text-5xl">
              {clinic?.name ? t('heroTitleWithClinic', { clinic: clinic.name }) : t('heroTitle')}
            </h1>
            <p className="mt-4 max-w-lg whitespace-pre-line break-words text-base leading-relaxed text-text-muted lg:text-lg">
              {clinic?.description || t('heroSubtitle')}
            </p>
            <div className="mt-5 flex flex-col gap-2 text-sm text-text-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
              {clinic?.address && (
                <span className="flex min-w-0 items-start gap-1.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 break-words">{clinic.address}</span>
                </span>
              )}
              {primaryContact && (
                <span className="flex min-w-0 items-start gap-1.5">
                  {primaryContact.contactType === 'EMAIL' ? (
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  )}
                  <span dir="auto" className="min-w-0 [overflow-wrap:anywhere]">
                    {primaryContact.value}
                  </span>
                </span>
              )}
            </div>
            <div className="mt-8">
              <Button
                size="lg"
                onClick={() => openBooking()}
                disabled={doctors.length === 0 || !bookingAllowed}
              >
                {t('bookAppointment')}
              </Button>
              {!bookingAllowed && (
                <p className="mt-2 text-sm text-text-muted">{t('bookingDisabled')}</p>
              )}
            </div>
          </div>

          {/* Hero image — fluid 3:2 box. A fixed 600px width would be clipped
              by the lg grid track, which is only 464px at 1024px wide. */}
          <div className="relative hidden lg:block">
            <div className="aspect-[3/2] w-full max-w-[600px] overflow-hidden rounded-2xl shadow-dropdown">
              {clinic?.image ? (
                <PublicImage
                  url={clinicImageUrl(clinic.image,)}
                  alt={clinic.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary-tint">
                  <Stethoscope className="h-20 w-20 text-primary/30" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────── DOCTORS + BOOKING ──────────────────── */}
      <section id="doctors" className="border-b border-border bg-surface-card">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {t('teamLabel')}
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-main sm:text-3xl">
            {t('team')}
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
            {t('teamSubtitle')}
          </p>

          {doctors.length === 0 ? (
            <div className="mt-8">
              <EmptyState message={tCommon('noData')} />
            </div>
          ) : (
            <ul className="mt-8 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doctor) => (
                <li
                  key={doctor.id}
                  className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface-bg shadow-subtle"
                >
                  {/* Media band — fixed responsive height rather than an aspect
                ratio, so it stays constant as the column count changes.
                Must read well both with a photo and with the initials
                fallback Avatar renders when there is none. */}
                  <div className="h-68 w-full shrink-0 overflow-hidden bg-primary-tint sm:h-68">
                    <Avatar
                      firstName={doctor.firstName}
                      lastName={doctor.lastName}
                      avatar={doctor.avatar}
                      kind="doctor"
                      size="lg"
                      className="!h-full !w-full !rounded-none !border-0 text-4xl sm:text-5xl [&_img]:!h-full [&_img]:!w-full [&_img]:!rounded-none [&_img]:object-cover [&_img]:object-top"
                    />
                  </div>

                  <div dir="auto" className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                    <div className="min-w-0">
                      <h3 className="text-lg font-extrabold leading-6 text-text-main [overflow-wrap:anywhere] sm:text-xl sm:leading-7">
                        {fullName(doctor.firstName, doctor.lastName)}
                      </h3>

                      <div className="mt-2 flex min-w-0 flex-wrap gap-1">
                        {doctor.specialties.length === 0 ? (
                          <span className="inline-flex min-w-0 items-center gap-1 text-xs text-text-dimmed">
                            <Stethoscope className="h-3.5 w-3.5 shrink-0" />
                            <span className="[overflow-wrap:anywhere]">{t('generalPractitioner')}</span>
                          </span>
                        ) : (
                          doctor.specialties.map((specialty) => (
                            <Badge
                              key={specialty.id}
                              variant="primary"
                              className="max-w-full [overflow-wrap:anywhere]"
                            >
                              {specialty.name}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="my-4 min-w-0">
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => openBooking(doctor.id)}
                        disabled={!bookingAllowed}
                        aria-label={`${t('bookAppointment')} — ${fullName(doctor.firstName, doctor.lastName)}`}
                      >
                        {t('bookAppointment')}
                      </Button>

                      {!bookingAllowed && (
                        <p className="mt-2 text-xs leading-5 text-text-muted [overflow-wrap:anywhere]">
                          {t('bookingDisabled')}
                        </p>
                      )}
                    </div>

                    {/* mt-auto absorbs the slack from grid row-stretching, so the
                  availability blocks bottom-align across a row while the
                  Book buttons above them stay level. */}
                    <div className="mt-auto min-w-0 border-t border-border pt-3">
                      <h4 className="flex items-center gap-1.5 text-xs font-semibold text-text-main">
                        <CalendarClock className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="min-w-0 [overflow-wrap:anywhere]">{t('viewAvailability')}</span>
                      </h4>

                      <DoctorAvailabilityPanel doctorId={doctor.id} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>


      {/* ──────────────────── ABOUT ──────────────────── */}
      <section id="about" className="border-b border-border bg-surface-card">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {t('aboutLabel')}
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-main sm:text-3xl">
            {t('aboutTitle')}
          </h2>

          <div className="mt-6">
            <p className="max-w-3xl whitespace-pre-line break-words text-sm leading-7 text-text-muted sm:text-base sm:leading-8">
              {clinic?.description || t('heroSubtitle')}
            </p>

            {(clinic?.address || primaryContact) && (
              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-x-8">
                {clinic?.address && (
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-tint">
                      <MapPin className="h-5 w-5 text-primary" />
                    </span>

                    <p className="min-w-0 self-center break-words text-sm leading-6 text-text-muted">
                      {clinic.address}
                    </p>
                  </div>
                )}

                {primaryContact && (
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-tint">
                      {primaryContact.contactType === 'EMAIL' ? (
                        <Mail className="h-5 w-5 text-primary" />
                      ) : (
                        <Phone className="h-5 w-5 text-primary" />
                      )}
                    </span>

                    <p
                      dir="auto"
                      className="min-w-0 self-center text-sm leading-6 text-text-muted [overflow-wrap:anywhere]"
                    >
                      {primaryContact.value}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Staff members (team) */}
          {staff.length > 0 && (
            <div className="mt-10 border-t border-border pt-8 sm:mt-12 sm:pt-10">
              <h3 className="text-xl font-bold tracking-tight text-text-main sm:text-2xl">
                {t('otherTeam')}
              </h3>

              <ul className="mt-6 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
                {staff.map((member) => (
                  <li
                    key={member.id}
                    className="relative min-w-0 overflow-hidden rounded-2xl border border-border bg-surface-bg shadow-subtle"
                  >
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-28 bg-primary-tint sm:h-32"
                    />

                    <div className="relative flex h-full flex-col items-center px-5 py-7 text-center sm:px-6 sm:py-8">
                      <div className="shrink-0 rounded-full bg-surface-card p-2 shadow-subtle">
                        <Avatar
                          firstName={member.firstName}
                          lastName={member.lastName}
                          avatar={member.avatar}
                          kind="staff"
                          size="lg"
                          className="!h-32 !w-32 shrink-0 overflow-hidden !rounded-full text-4xl sm:!h-36 sm:!w-36 [&_img]:!h-full [&_img]:!w-full [&_img]:!rounded-full [&_img]:object-cover [&_img]:object-top"
                        />
                      </div>

                      <h4 className="mt-5 w-full text-xl font-bold leading-7 text-text-main [overflow-wrap:anywhere]">
                        {fullName(member.firstName, member.lastName)}
                      </h4>

                      <div className="mt-auto w-full pt-3">
                        <p className="inline-block max-w-full rounded-full bg-primary-tint px-4 py-2 text-sm font-semibold leading-5 text-primary [overflow-wrap:anywhere]">
                          {t(STAFF_ROLE_KEY[member.type] ?? 'roleReceptionist')}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>


      {/* ──────────────────── SERVICES ──────────────────── */}
      <section id="services" className="border-b border-border bg-surface-bg">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {t('servicesLabel')}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-text-main sm:text-3xl">
            {t('services')}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
            {t('servicesSubtitle')}
          </p>
          {services.length === 0 ? (
            <div className="mt-8">
              <EmptyState message={tCommon('noData')} />
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <Link
                  key={service.id}
                  href={`/services/${service.id}`}
                  className="group overflow-hidden rounded-xl border border-border bg-surface-card shadow-subtle transition-shadow hover:shadow-dropdown"
                >
                  <div className="h-44 w-full overflow-hidden bg-surface-bg sm:h-48">
                    <PublicImage
                      url={service.image ? serviceImageUrl(service.image, 'm') : null}
                      alt={service.name}
                      className="h-full w-full transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-text-main">{service.name}</h3>
                    {service.description && (
                      <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-text-muted">
                        {service.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ──────────────────── ARTICLES ──────────────────── */}
      {showArticles && (
        <section id="articles" className="border-b border-border bg-surface-bg">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {t('articlesLabel')}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-text-main sm:text-3xl">
              {t('articlesTitle')}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
              {t('articlesSubtitle')}
            </p>
            {articles.length === 0 ? (
              <div className="mt-8">
                <EmptyState message={t('articlesEmpty')} hint={t('articlesEmptyHint')} />
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.id}`}
                    className="group overflow-hidden rounded-xl border border-border bg-surface-card shadow-subtle transition-shadow hover:shadow-dropdown"
                  >
                    <div className="h-44 w-full overflow-hidden bg-surface-bg sm:h-48">
                      <PublicImage
                        url={article.image ? articleImageUrl(article.image, 'm') : null}
                        alt={article.title}
                        className="h-full w-full transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-text-main">{article.title}</h3>
                      <div
                        className="pointer-events-none mt-1.5 line-clamp-3 text-sm leading-relaxed text-text-muted [&_a]:underline [&_p]:mb-1 [&_strong]:font-semibold"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ──────────────────── CONTACT ──────────────────── */}
      <section id="contact" className="bg-surface-card">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            {t('contactLabel')}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-text-main sm:text-3xl">
            {t('contact')}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
            {t('contactSubtitle')}
          </p>
          {contacts.length === 0 && !clinic?.address ? (
            <div className="mt-8">
              <EmptyState message={tCommon('noData')} />
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clinic?.address && (
                <div className="flex min-w-0 items-start gap-3 rounded-xl border border-border bg-surface-bg p-4 sm:p-5">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="min-w-0 break-words text-sm text-text-main">
                    {clinic.address}
                  </span>
                </div>
              )}
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex min-w-0 items-start gap-3 rounded-xl border border-border bg-surface-bg p-4 sm:p-5"
                >
                  {contact.contactType === 'EMAIL' ? (
                    <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  ) : (
                    <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  )}
                  {/* min-w-0 + overflow-wrap are load-bearing: without them an
                      unbreakable address or email resolves the flex item's
                      min-width to the longest word and overflows the page. */}
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium text-text-main">
                      {contact.name}
                    </p>
                    <p dir="auto" className="text-sm text-text-muted [overflow-wrap:anywhere]">
                      {contact.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        doctors={doctors}
        mode={loggedIn ? 'patient' : 'anonymous'}
        initialDoctorId={bookingDoctorId}
        onBooked={() => { }}
      />

      <Footer clinic={clinic} contacts={contacts} />
    </div>
  );
}
