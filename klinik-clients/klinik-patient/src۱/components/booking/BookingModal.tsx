'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { fullName, formatLocalDate } from '@/lib/utils';
import {
  hasErrors,
  isOtpCode,
  isPhone,
  maxLength,
  minLength,
  required,
  validate,
} from '@/lib/validation';
import { getAvailableSlots } from '@/services/availability.service';
import {
  bookAppointmentAnonymous,
  bookAppointmentAsPatient,
  requestBookingOtp,
} from '@/services/appointments.service';
import { ApiError } from '@/lib/api-client';
import type { AvailableSlot, Doctor } from '@/types/domain';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  doctors: Doctor[];
  /** anonymous = public homepage booking (needs OTP); patient = already logged in. */
  mode: 'anonymous' | 'patient';
  onBooked: () => void;
  /** Preselect a doctor — e.g. when opened from that doctor's "Book" button. */
  initialDoctorId?: string;
}

interface FormValues {
  doctorId: string;
  date: string;
  subject: string;
  description: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  code: string;
}

const today = () => formatLocalDate(new Date());

// Mirrors the backend's OTP_RESEND_COOLDOWN_SECONDS default — purely a UX
// countdown; the server is the source of truth and still rejects early resends.
const RESEND_COOLDOWN_SECONDS = 60;

export function BookingModal({
  open,
  onClose,
  doctors,
  mode,
  onBooked,
  initialDoctorId,
}: BookingModalProps) {
  const t = useTranslations('booking');
  const tv = useTranslations('common.validation');

  const [values, setValues] = useState<FormValues>({
    doctorId: initialDoctorId ?? doctors[0]?.id ?? '',
    date: today(),
    subject: '',
    description: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    code: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const setField = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  useEffect(() => {
    if (!open) return;
    setValues({
      doctorId: initialDoctorId ?? doctors[0]?.id ?? '',
      date: today(),
      subject: '',
      description: '',
      firstName: '',
      lastName: '',
      phone: '',
      dateOfBirth: '',
      code: '',
    });
    setErrors({});
    setSelectedSlot(null);
    setOtpSent(false);
    setResendCooldown(0);
    setFormError(null);
    setSuccess(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!otpSent || resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpSent, resendCooldown]);

  useEffect(() => {
    if (!open || !values.doctorId || !values.date) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    setSelectedSlot(null);
    getAvailableSlots(values.doctorId, values.date)
      .then((res) => {
        if (!cancelled) setSlots(res);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, values.doctorId, values.date]);

  const handleSendOtp = async () => {
    const newErrors = validate(values, {
      phone: [required(tv('required')), isPhone(tv('invalidPhone'))],
      firstName: [required(tv('required')), minLength(2, tv('minLength', { min: 2 }))],
      lastName: [required(tv('required')), minLength(2, tv('minLength', { min: 2 }))],
    });
    setErrors(newErrors);
    if (hasErrors(newErrors)) return;

    setSendingOtp(true);
    setFormError(null);
    try {
      await requestBookingOtp(values.phone);
      setOtpSent(true);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setField('code', '');
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('genericError'));
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSlot) {
      setFormError(t('selectSlotFirst'));
      return;
    }

    const schema: Partial<Record<keyof FormValues, ReturnType<typeof required>[]>> = {
      doctorId: [required(tv('selectDoctor'))],
      subject: [maxLength(200, tv('maxLength', { max: 200 }))],
      description: [maxLength(2000, tv('maxLength', { max: 2000 }))],
    };
    if (mode === 'anonymous') {
      schema.code = [required(tv('required')), isOtpCode(t('invalidCode'))];
    }
    const newErrors = validate(values, schema);
    setErrors(newErrors);
    if (hasErrors(newErrors)) return;

    setSubmitting(true);
    setFormError(null);
    try {
      if (mode === 'anonymous') {
        await bookAppointmentAnonymous({
          phone: values.phone,
          code: values.code,
          firstName: values.firstName,
          lastName: values.lastName,
          dateOfBirth: values.dateOfBirth || undefined,
          doctorId: values.doctorId,
          subject: values.subject || undefined,
          description: values.description || undefined,
          date: selectedSlot.date,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
        });
      } else {
        await bookAppointmentAsPatient({
          doctorId: values.doctorId,
          subject: values.subject || undefined,
          description: values.description || undefined,
          date: selectedSlot.date,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
        });
      }
      setSuccess(true);
      onBooked();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoctor = doctors.find((d) => d.id === values.doctorId);

  return (
    <Modal open={open} onClose={onClose} title={t('title')}>
      {success ? (
        <div className="space-y-4 text-center">
          <p className="text-base font-medium text-text-main">{t('successTitle')}</p>
          <p className="text-sm text-text-muted">
            {t('successMessage', {
              doctor: selectedDoctor ? fullName(selectedDoctor.firstName, selectedDoctor.lastName) : '',
              date: selectedSlot?.date.slice(0, 10) ?? '',
              time: selectedSlot?.startTime ?? '',
            })}
          </p>
          <Button onClick={onClose} className="w-full">
            {t('close')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Select
            label={t('doctor')}
            value={values.doctorId}
            onChange={(v) => setField('doctorId', v)}
            placeholder={t('noDoctors')}
            options={doctors.map((doctor) => ({
              value: doctor.id,
              label: fullName(doctor.firstName, doctor.lastName),
            }))}
          />

          <DatePicker
            label={t('date')}
            minDate={today()}
            value={values.date}
            onChange={(v) => setField('date', v)}
          />

          <div className="flex w-full flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-tight text-text-main">
              {t('availableSlots')}
            </label>
            {loadingSlots ? (
              <div className="flex justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : slots.length === 0 ? (
              <p className="text-xs text-text-dimmed">{t('noSlots')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => {
                  const isSelected =
                    selectedSlot?.startTime === slot.startTime &&
                    selectedSlot?.date === slot.date;
                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${isSelected
                          ? 'border-primary bg-primary-tint text-primary'
                          : 'border-border bg-surface-card text-text-muted hover:bg-surface-bg'
                        }`}
                    >
                      {slot.startTime}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <Input
            label={t('subject')}
            maxLength={200}
            value={values.subject}
            onChange={(e) => setField('subject', e.target.value)}
            errorMessage={errors.subject}
          />
          <Textarea
            label={t('description')}
            rows={2}
            maxLength={2000}
            value={values.description}
            onChange={(e) => setField('description', e.target.value)}
            errorMessage={errors.description}
          />

          {mode === 'anonymous' && (
            <div className="space-y-4 rounded-lg border border-border bg-surface-bg/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                {t('yourDetails')}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label={t('firstName')}
                  required
                  disabled={otpSent}
                  value={values.firstName}
                  onChange={(e) => setField('firstName', e.target.value)}
                  errorMessage={errors.firstName}
                />
                <Input
                  label={t('lastName')}
                  required
                  disabled={otpSent}
                  value={values.lastName}
                  onChange={(e) => setField('lastName', e.target.value)}
                  errorMessage={errors.lastName}
                />
              </div>
              <Input
                label={t('phone')}
                type="tel"
                required
                disabled={otpSent}
                placeholder="+41 71 000 00 00"
                value={values.phone}
                onChange={(e) => setField('phone', e.target.value)}
                errorMessage={errors.phone}
              />
              <DatePicker
                label={t('dateOfBirth')}
                disabled={otpSent}
                value={values.dateOfBirth}
                onChange={(v) => setField('dateOfBirth', v)}
              />

              {!otpSent ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  isLoading={sendingOtp}
                  onClick={handleSendOtp}
                >
                  {t('sendCode')}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Input
                    label={t('otpCode')}
                    required
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={values.code}
                    onChange={(e) => setField('code', e.target.value)}
                    errorMessage={errors.code}
                    helperText={t('codeHint')}
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={resendCooldown > 0 || sendingOtp}
                    className="text-xs font-medium text-primary transition-colors hover:text-primary-hover disabled:cursor-not-allowed disabled:text-text-dimmed"
                  >
                    {resendCooldown > 0
                      ? t('resendCodeIn', { seconds: resendCooldown })
                      : t('resendCode')}
                  </button>
                </div>
              )}
            </div>
          )}

          {formError && (
            <div
              role="alert"
              className="rounded-md border border-status-rejected-fg/20 bg-status-rejected-bg px-3 py-2 text-sm text-status-rejected-fg"
            >
              {formError}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button
              type="button"
              isLoading={submitting}
              disabled={mode === 'anonymous' && !otpSent}
              onClick={handleSubmit}
            >
              {t('confirmBooking')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
