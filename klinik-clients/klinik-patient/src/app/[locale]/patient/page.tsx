'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Calendar, Clock, Home, LogOut, Pencil, Upload } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import { BookingModal } from '@/components/booking/BookingModal';
import { RescheduleModal } from '@/components/booking/RescheduleModal';
import { SelfLoadingFooter } from '@/components/layout/SelfLoadingFooter';
import { fullName, formatDate } from '@/lib/utils';
import { hasErrors, isOtpCode, isPhone, minLength, required, validate } from '@/lib/validation';
import { ApiError } from '@/lib/api-client';
import { getCurrentPatient, isAuthenticated } from '@/lib/auth';
import {
  fetchCurrentPatient,
  requestLoginOtp,
  loginWithOtp,
  updateProfile,
  listMyAppointments,
  cancelAppointment,
  listDoctors,
  getClinicSetting,
  logout,
} from '@/services';
import type { Appointment, Doctor, Patient } from '@/types/domain';

const STATUS_VARIANT: Record<Appointment['status'], 'success' | 'neutral' | 'danger' | 'warning' | 'primary'> = {
  BOOKED: 'warning',
  APPROVED: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
  REJECTED: 'danger',
  NOT_SHOW: 'neutral',
};

const MODIFIABLE_STATUSES: Appointment['status'][] = ['BOOKED', 'APPROVED'];

export default function PatientPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      setCheckingAuth(false);
      return;
    }
    setPatient(getCurrentPatient());
    fetchCurrentPatient()
      .then(setPatient)
      .catch(() => {
        setPatient(null);
      })
      .finally(() => setCheckingAuth(false));
  }, []);

  if (checkingAuth) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!patient) {
    return <LoginGate onLoggedIn={setPatient} />;
  }

  return <PatientDashboard patient={patient} onPatientUpdate={setPatient} />;
}

/* ── Login ─────────────────────────────────────────────────────────────── */

function LoginGate({ onLoggedIn }: { onLoggedIn: (patient: Patient) => void }) {
  const t = useTranslations('patientPage.login');
  const tv = useTranslations('common.validation');

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<{ phone?: string; code?: string }>({});
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    const newErrors = validate(
      { phone },
      { phone: [required(tv('required')), isPhone(tv('invalidPhone'))] },
    );
    setErrors(newErrors);
    if (hasErrors(newErrors)) return;

    setSending(true);
    setError(null);
    try {
      await requestLoginOtp(phone);
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('genericError'));
    } finally {
      setSending(false);
    }
  };

  const handleLogin = async () => {
    const newErrors = validate(
      { code },
      { code: [required(tv('required')), isOtpCode(t('invalidCode'))] },
    );
    setErrors(newErrors);
    if (hasErrors(newErrors)) return;

    setSubmitting(true);
    setError(null);
    try {
      const loggedInPatient = await loginWithOtp(phone, code);
      onLoggedIn(loggedInPatient);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-main sm:text-3xl">{t('title')}</h1>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">{t('subtitle')}</p>
        </div>

        <div className="mt-8 space-y-4 rounded-3xl border border-border bg-surface-card p-5 shadow-subtle sm:p-6">
          <Input
            label={t('phone')}
            type="tel"
            required
            disabled={otpSent}
            placeholder="+41 71 000 00 00"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setErrors((err) => ({ ...err, phone: undefined }));
            }}
            errorMessage={errors.phone}
          />

          {!otpSent ? (
            <Button className="w-full" isLoading={sending} onClick={handleSendOtp}>
              {t('sendCode')}
            </Button>
          ) : (
            <>
              <Input
                label={t('otpCode')}
                required
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setErrors((err) => ({ ...err, code: undefined }));
                }}
                errorMessage={errors.code}
                helperText={t('codeHint')}
              />
              <Button className="w-full" isLoading={submitting} onClick={handleLogin}>
                {t('login')}
              </Button>
            </>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-status-rejected-fg/20 bg-status-rejected-bg px-3 py-2 text-sm text-status-rejected-fg"
            >
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard ─────────────────────────────────────────────────────────── */

function PatientDashboard({
  patient,
  onPatientUpdate,
}: {
  patient: Patient;
  onPatientUpdate: (patient: Patient) => void;
}) {
  const t = useTranslations('patientPage');
  const tStatus = useTranslations('appointmentStatus');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [bookingAllowed, setBookingAllowed] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadAppointments = () => {
    setLoadingAppointments(true);
    listMyAppointments({ limit: 50 })
      .then((res) => setAppointments(res.data))
      .catch(() => setAppointments([]))
      .finally(() => setLoadingAppointments(false));
  };

  useEffect(() => {
    loadAppointments();
    listDoctors({ limit: 50 })
      .then((res) => setDoctors(res.data))
      .catch(() => setDoctors([]));
    getClinicSetting()
      .then((setting) => setBookingAllowed(setting.allowPatientBooking))
      .catch(() => setBookingAllowed(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = `/${locale}`;
  };

  const openCancel = (apt: Appointment) => {
    setCancelTarget(apt);
    setCancelReason('');
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await cancelAppointment(cancelTarget.id, cancelReason.trim() || undefined);
      setCancelTarget(null);
      loadAppointments();
    } finally {
      setCancelling(false);
    }
  };

  const sorted = [...appointments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <>
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:py-14">
      {/* ── Profile header ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface-card p-5 shadow-subtle sm:flex-row sm:items-center sm:justify-between sm:p-6 lg:p-8">
        <div className="flex items-center gap-4">
          <Avatar
            firstName={patient.firstName}
            lastName={patient.lastName}
            avatar={patient.avatar}
            kind="patient"
            size="lg"
          />
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-text-main sm:text-xl lg:text-2xl">
              {fullName(patient.firstName, patient.lastName)}
            </h1>
            <p className="text-sm text-text-muted">{patient.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/')}>
            <Home className="h-3.5 w-3.5" />
            <span>{t('home')}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)}>
            <Pencil className="h-3.5 w-3.5" />
            <span>{t('editProfile')}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-3.5 w-3.5" />
            <span>{t('logout')}</span>
          </Button>
        </div>
      </div>

      {/* ── Appointments header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-text-main sm:text-xl">{t('myAppointments')}</h2>
        <Button
          size="sm"
          onClick={() => setBookingOpen(true)}
          disabled={doctors.length === 0 || !bookingAllowed}
        >
          {t('newAppointment')}
        </Button>
      </div>

      {!bookingAllowed && (
        <p className="text-sm text-text-muted">{t('bookingDisabled')}</p>
      )}

      {/* ── Appointment list ── */}
      {loadingAppointments ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState message={t('noAppointments')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((apt) => {
            const modifiable = MODIFIABLE_STATUSES.includes(apt.status);
            return (
              <div
                key={apt.id}
                className="flex flex-col justify-between gap-4 rounded-3xl border border-border bg-surface-card p-4 shadow-subtle transition-shadow hover:shadow-dropdown sm:p-5"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-text-main">
                      {t('withDoctor', {
                        doctor: fullName(apt.doctorFirstName, apt.doctorLastName),
                      })}
                    </span>
                    <Badge variant={STATUS_VARIANT[apt.status]}>{tStatus(apt.status)}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(apt.date, locale)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {apt.startTime} – {apt.endTime}
                    </span>
                  </div>
                  {apt.subject && (
                    <p className="text-sm leading-relaxed text-text-muted">{apt.subject}</p>
                  )}
                </div>
                {modifiable && (
                  <div className="flex items-center gap-2 border-t border-border pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setRescheduleTarget(apt)}
                    >
                      {t('reschedule')}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="flex-1"
                      onClick={() => openCancel(apt)}
                    >
                      {t('cancel')}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}
      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        doctors={doctors}
        mode="patient"
        onBooked={loadAppointments}
      />

      <RescheduleModal
        open={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        appointment={rescheduleTarget}
        onRescheduled={loadAppointments}
      />

      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => (!cancelling ? setCancelTarget(null) : undefined)}
        title={t('confirmCancel.title')}
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelTarget(null)} disabled={cancelling}>
              {tCommon('cancel')}
            </Button>
            <Button variant="danger" onClick={confirmCancel} isLoading={cancelling}>
              {t('confirmCancel.confirm')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-text-muted">{t('confirmCancel.message')}</p>
          <Textarea
            label={t('confirmCancel.reasonLabel')}
            placeholder={t('confirmCancel.reasonPlaceholder')}
            rows={3}
            maxLength={500}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </div>
      </Modal>

      <ProfileModal
        open={editingProfile}
        onClose={() => setEditingProfile(false)}
        patient={patient}
        onSaved={onPatientUpdate}
      />
    </div>
    <SelfLoadingFooter />
    </>
  );
}

/* ── Profile Modal ─────────────────────────────────────────────────────── */

function ProfileModal({
  open,
  onClose,
  patient,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  patient: Patient;
  onSaved: (patient: Patient) => void;
}) {
  const t = useTranslations('patientPage.profileForm');
  const tv = useTranslations('common.validation');

  const [firstName, setFirstName] = useState(patient.firstName);
  const [lastName, setLastName] = useState(patient.lastName);
  const [address, setAddress] = useState(patient.address ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(
    patient.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : '',
  );
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string }>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFirstName(patient.firstName);
    setLastName(patient.lastName);
    setAddress(patient.address ?? '');
    setDateOfBirth(patient.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : '');
    setAvatarFile(null);
    setAvatarPreview(null);
    setError(null);
    setErrors({});
  }, [open, patient]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validate(
      { firstName, lastName },
      {
        firstName: [required(tv('required')), minLength(2, tv('minLength', { min: 2 }))],
        lastName: [required(tv('required')), minLength(2, tv('minLength', { min: 2 }))],
      },
    );
    setErrors(newErrors);
    if (hasErrors(newErrors)) return;

    setSubmitting(true);
    setError(null);
    try {
      const updated = await updateProfile(
        { firstName, lastName, address: address || undefined, dateOfBirth: dateOfBirth || undefined },
        avatarFile,
      );
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('title')}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="flex items-center gap-4">
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarPreview}
              alt=""
              className="h-16 w-16 rounded-full border border-border object-cover"
            />
          ) : (
            <Avatar
              firstName={firstName || '?'}
              lastName={lastName || ''}
              avatar={patient.avatar}
              kind="patient"
              size="lg"
            />
          )}
          <label className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface-card px-3 py-1.5 text-xs font-semibold text-text-main transition-colors hover:bg-surface-bg">
            <Upload className="h-3.5 w-3.5" />
            {t('uploadAvatar')}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('firstName')}
            required
            minLength={2}
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              setErrors((err) => ({ ...err, firstName: undefined }));
            }}
            errorMessage={errors.firstName}
          />
          <Input
            label={t('lastName')}
            required
            minLength={2}
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              setErrors((err) => ({ ...err, lastName: undefined }));
            }}
            errorMessage={errors.lastName}
          />
        </div>

        <Input
          label={t('address')}
          maxLength={255}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <DatePicker
          label={t('dateOfBirth')}
          value={dateOfBirth}
          onChange={(v) => setDateOfBirth(v)}
        />

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-status-rejected-fg/20 bg-status-rejected-bg px-3 py-2 text-sm text-status-rejected-fg"
          >
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="submit" isLoading={submitting}>
            {t('save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}