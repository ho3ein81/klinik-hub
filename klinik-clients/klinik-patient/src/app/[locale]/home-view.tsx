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

/* ── Shared look (presentation only) ──────────────────────────────────── */

/** Every section is a rounded card floating on the page background. */
const SECTION = 'mx-auto w-full max-w-[1440px] rounded-[28px] sm:rounded-[36px]';
const SECTION_PAD = 'px-5 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-[72px]';
const EYEBROW = 'text-xs font-semibold uppercase tracking-[0.14em] text-primary';
const H2 =
  'mt-2 text-3xl font-medium tracking-tight text-text-main sm:text-4xl lg:text-[44px] lg:leading-[1.15]';
const SUBTITLE = 'mt-3 max-w-xl text-base leading-relaxed text-text-muted';

/** Image-on-top card used by services, articles and team members. */
const CARD = 'group flex min-w-0 flex-col gap-4 rounded-3xl bg-primary-tint p-3';
const CARD_LINK = `${CARD} transition-shadow hover:shadow-dropdown`;
const CARD_IMAGE = 'h-48 w-full overflow-hidden rounded-2xl bg-tint-strong';
const CARD_BODY = 'flex flex-col gap-2 px-3 pb-4';
const CARD_GRID =
  'mt-10 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4';

/** Photo that fills its frame, with the initials fallback Avatar renders. */
const AVATAR_FILL =
  '!h-full !w-full !rounded-none !border-0 [&_img]:!h-full [&_img]:!w-full [&_img]:!rounded-none [&_img]:object-cover [&_img]:object-top';

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

  // One or two doctors get a full-width profile each (stacked, alternating
  // sides); a bigger team falls back to a card grid.
  const profileLayout = doctors.length > 0 && doctors.length <= 2;

  const openBooking = useCallback((doctorId?: string) => {
    setBookingDoctorId(doctorId);
    setBookingOpen(true);
  }, []);

  return (
    <div className="relative">
      <div className="space-y-3 px-3 pt-3 sm:space-y-4 sm:px-4 lg:space-y-6 lg:px-6">
        {/* ──────────────────── HERO ──────────────────── */}
        <section
          className={`${SECTION} overflow-hidden bg-linear-to-br from-[#e8eeff] via-[#dbe5fb] to-[#eef3ff]`}
        >
          <div className="grid items-stretch gap-8 px-5 pt-10 sm:px-10 sm:pt-14 lg:grid-cols-2 lg:gap-12 lg:px-16 lg:pt-16">
            <div className="flex min-w-0 flex-col justify-center pb-10 lg:pb-20">
              <p className={EYEBROW}>{t('heroLabel')}</p>
              <h1 className="mt-4 text-4xl font-medium leading-[1.1] tracking-tight text-text-main [overflow-wrap:anywhere] sm:text-5xl lg:text-[60px]">
                {clinic?.name ? t('heroTitleWithClinic', { clinic: clinic.name }) : t('heroTitle')}
              </h1>
              <p className="mt-5 max-w-lg whitespace-pre-line break-words text-base leading-relaxed text-text-muted lg:text-lg">
                {clinic?.description || t('heroSubtitle')}
              </p>
              <div className="mt-6 flex flex-col gap-2 text-sm text-text-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
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

            {/* Hero image — a panel standing on the bottom edge of the card. */}
            <div className="relative hidden min-h-[440px] lg:block">
              <div className="absolute inset-x-0 bottom-0 top-8 overflow-hidden rounded-t-[32px] bg-white/55">
                {clinic?.image ? (
                  <PublicImage
                    url={clinicImageUrl(clinic.image,)}
                    alt={clinic.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Stethoscope className="h-20 w-20 text-primary/30" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ──────────────────── DOCTORS + BOOKING ──────────────────── */}
        <section id="doctors" className={`${SECTION} ${SECTION_PAD} bg-tint-strong`}>
          <p className={EYEBROW}>{t('teamLabel')}</p>
          <h2 className={H2}>{t('team')}</h2>
          <p className={SUBTITLE}>{t('teamSubtitle')}</p>

          {doctors.length === 0 ? (
            <div className="mt-8">
              <EmptyState message={tCommon('noData')} />
            </div>
          ) : (
            <ul
              className={
                profileLayout
                  ? 'mt-10 flex list-none flex-col gap-5 p-0'
                  : 'mt-10 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3'
              }
            >
              {doctors.map((doctor, index) =>
                profileLayout ? (
                  /* One or two doctors: a full profile, photo beside details. */
                  <li
                    key={doctor.id}
                    className={`flex min-w-0 flex-col gap-3 overflow-hidden rounded-[28px] bg-surface-card p-3 sm:rounded-[32px] ${
                      index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'
                    }`}
                  >
                    <div className="h-80 w-full shrink-0 overflow-hidden rounded-3xl bg-primary-tint sm:h-96 lg:h-auto lg:min-h-[480px] lg:w-1/2">
                      <Avatar
                        firstName={doctor.firstName}
                        lastName={doctor.lastName}
                        avatar={doctor.avatar}
                        kind="doctor"
                        size="lg"
                        className={`${AVATAR_FILL} text-6xl lg:text-8xl`}
                      />
                    </div>

                    <div
                      dir="auto"
                      className="flex min-w-0 flex-1 flex-col justify-center gap-6 p-4 sm:p-8 lg:p-10"
                    >
                      <h3 className="text-3xl font-medium leading-[1.1] tracking-tight text-text-main [overflow-wrap:anywhere] lg:text-[44px]">
                        {fullName(doctor.firstName, doctor.lastName)}
                      </h3>

                      <div className="flex min-w-0 flex-wrap gap-2">
                        {doctor.specialties.length === 0 ? (
                          <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-text-dimmed">
                            <Stethoscope className="h-4 w-4 shrink-0" />
                            <span className="[overflow-wrap:anywhere]">{t('generalPractitioner')}</span>
                          </span>
                        ) : (
                          doctor.specialties.map((specialty) => (
                            <Badge
                              key={specialty.id}
                              variant="primary"
                              className="max-w-full px-4 py-2 text-sm [overflow-wrap:anywhere]"
                            >
                              {specialty.name}
                            </Badge>
                          ))
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-text-dimmed">
                          <CalendarClock className="h-4 w-4 shrink-0 text-primary" />
                          <span className="min-w-0 [overflow-wrap:anywhere]">{t('viewAvailability')}</span>
                        </h4>
                        <DoctorAvailabilityPanel doctorId={doctor.id} />
                      </div>

                      <div className="min-w-0">
                        <Button
                          size="lg"
                          onClick={() => openBooking(doctor.id)}
                          disabled={!bookingAllowed}
                          aria-label={`${t('bookAppointment')} — ${fullName(doctor.firstName, doctor.lastName)}`}
                        >
                          {t('bookAppointment')}
                        </Button>

                        {!bookingAllowed && (
                          <p className="mt-2 text-sm leading-5 text-text-muted [overflow-wrap:anywhere]">
                            {t('bookingDisabled')}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ) : (
                  /* Larger teams: compact card. */
                  <li
                    key={doctor.id}
                    className="flex h-full min-w-0 flex-col gap-3 overflow-hidden rounded-[28px] bg-surface-card p-3"
                  >
                    <div className="h-72 w-full shrink-0 overflow-hidden rounded-3xl bg-primary-tint">
                      <Avatar
                        firstName={doctor.firstName}
                        lastName={doctor.lastName}
                        avatar={doctor.avatar}
                        kind="doctor"
                        size="lg"
                        className={`${AVATAR_FILL} text-5xl`}
                      />
                    </div>

                    <div dir="auto" className="flex min-w-0 flex-1 flex-col px-3 pb-3 pt-1">
                      <div className="min-w-0">
                        <h3 className="text-xl font-medium leading-7 text-text-main [overflow-wrap:anywhere]">
                          {fullName(doctor.firstName, doctor.lastName)}
                        </h3>

                        <div className="mt-2 flex min-w-0 flex-wrap gap-1.5">
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
                ),
              )}
            </ul>
          )}
        </section>

        {/* ──────────────────── ABOUT ──────────────────── */}
        <section id="about" className={`${SECTION} ${SECTION_PAD} bg-surface-card`}>
          <p className={EYEBROW}>{t('aboutLabel')}</p>
          <h2 className={H2}>{t('aboutTitle')}</h2>

          <div className="mt-6">
            <p className="max-w-3xl whitespace-pre-line break-words text-base leading-8 text-text-muted">
              {clinic?.description || t('heroSubtitle')}
            </p>

            {(clinic?.address || primaryContact) && (
              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-x-8">
                {clinic?.address && (
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-tint">
                      <MapPin className="h-5 w-5 text-primary" />
                    </span>

                    <p className="min-w-0 self-center break-words text-sm leading-6 text-text-muted">
                      {clinic.address}
                    </p>
                  </div>
                )}

                {primaryContact && (
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-tint">
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

          {/* Staff members (team) — same image-on-top card as services/articles */}
          {staff.length > 0 && (
            <div className="mt-12 border-t border-border pt-10">
              <h3 className="text-2xl font-medium tracking-tight text-text-main sm:text-3xl">
                {t('otherTeam')}
              </h3>

              <ul className={CARD_GRID}>
                {staff.map((member) => (
                  <li key={member.id} className={CARD}>
                    <div className={CARD_IMAGE}>
                      <Avatar
                        firstName={member.firstName}
                        lastName={member.lastName}
                        avatar={member.avatar}
                        kind="staff"
                        size="lg"
                        className={`${AVATAR_FILL} bg-tint-strong text-4xl`}
                      />
                    </div>

                    <div className={CARD_BODY}>
                      <span className="text-xs font-medium text-text-dimmed">
                        {t(STAFF_ROLE_KEY[member.type] ?? 'roleReceptionist')}
                      </span>
                      <h4 className="text-xl font-medium leading-7 text-text-main [overflow-wrap:anywhere]">
                        {fullName(member.firstName, member.lastName)}
                      </h4>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* ──────────────────── SERVICES ──────────────────── */}
        <section id="services" className={`${SECTION} ${SECTION_PAD} bg-surface-card`}>
          <p className={EYEBROW}>{t('servicesLabel')}</p>
          <h2 className={H2}>{t('services')}</h2>
          <p className={SUBTITLE}>{t('servicesSubtitle')}</p>
          {services.length === 0 ? (
            <div className="mt-8">
              <EmptyState message={tCommon('noData')} />
            </div>
          ) : (
            <div className={CARD_GRID}>
              {services.map((service) => (
                <Link
                  key={service.id}
                  href={`/services/${service.id}`}
                  className={CARD_LINK}
                >
                  <div className={CARD_IMAGE}>
                    <PublicImage
                      url={service.image ? serviceImageUrl(service.image, 'm') : null}
                      alt={service.name}
                      className="h-full w-full bg-tint-strong transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className={CARD_BODY}>
                    <h3 className="text-xl font-medium leading-7 text-text-main">{service.name}</h3>
                    {service.description && (
                      <p className="line-clamp-3 text-sm leading-relaxed text-text-muted">
                        {service.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ──────────────────── ARTICLES ──────────────────── */}
        {showArticles && (
          <section id="articles" className={`${SECTION} ${SECTION_PAD} bg-surface-card`}>
            <p className={EYEBROW}>{t('articlesLabel')}</p>
            <h2 className={H2}>{t('articlesTitle')}</h2>
            <p className={SUBTITLE}>{t('articlesSubtitle')}</p>
            {articles.length === 0 ? (
              <div className="mt-8">
                <EmptyState message={t('articlesEmpty')} hint={t('articlesEmptyHint')} />
              </div>
            ) : (
              <div className={CARD_GRID}>
                {articles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.id}`}
                    className={CARD_LINK}
                  >
                    <div className={CARD_IMAGE}>
                      <PublicImage
                        url={article.image ? articleImageUrl(article.image, 'm') : null}
                        alt={article.title}
                        className="h-full w-full bg-tint-strong transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className={CARD_BODY}>
                      <h3 className="text-xl font-medium leading-7 text-text-main">{article.title}</h3>
                      <div
                        className="pointer-events-none line-clamp-3 text-sm leading-relaxed text-text-muted [&_a]:underline [&_p]:mb-1 [&_strong]:font-semibold"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ──────────────────── CONTACT ──────────────────── */}
        <section id="contact" className={`${SECTION} ${SECTION_PAD} bg-surface-card`}>
          <p className={EYEBROW}>{t('contactLabel')}</p>
          <h2 className={H2}>{t('contact')}</h2>
          <p className={SUBTITLE}>{t('contactSubtitle')}</p>
          {contacts.length === 0 && !clinic?.address ? (
            <div className="mt-8">
              <EmptyState message={tCommon('noData')} />
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clinic?.address && (
                <div className="flex min-w-0 items-start gap-4 rounded-3xl bg-primary-tint p-5 sm:p-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-card">
                    <MapPin className="h-5 w-5 text-primary" />
                  </span>
                  <span className="min-w-0 self-center break-words text-sm text-text-main">
                    {clinic.address}
                  </span>
                </div>
              )}
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex min-w-0 items-start gap-4 rounded-3xl bg-primary-tint p-5 sm:p-6"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-card">
                    {contact.contactType === 'EMAIL' ? (
                      <Mail className="h-5 w-5 text-primary" />
                    ) : (
                      <Phone className="h-5 w-5 text-primary" />
                    )}
                  </span>
                  {/* min-w-0 + overflow-wrap are load-bearing: without them an
                      unbreakable address or email resolves the flex item's
                      min-width to the longest word and overflows the page. */}
                  <div className="min-w-0 self-center">
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
        </section>
      </div>

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
