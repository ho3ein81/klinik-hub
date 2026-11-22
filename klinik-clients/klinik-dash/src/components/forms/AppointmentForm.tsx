'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { hasErrors, isPhone, maxLength, minLength, required, validate } from '@/lib/validation';
import { getAvailableSlots } from '@/services';
import type { AvailableSlot, ClinicUser, Patient } from '@/types/domain';

export interface AppointmentFormValues {
  patientId: string;
  firstName: string;
  lastName: string;
  phone: string;
  doctorId: string;
  subject: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface AppointmentFormProps {
  doctors: ClinicUser[];
  patients: Patient[];
  onSubmit: (values: AppointmentFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  errorMessage?: string | null;
}

export function AppointmentForm({
  doctors,
  patients,
  onSubmit,
  onCancel,
  submitting,
  errorMessage,
}: AppointmentFormProps) {
  const t = useTranslations('appointments.form');
  const tv = useTranslations('common.validation');
  const tCommon = useTranslations('common');

  const [isNewPatient, setIsNewPatient] = useState(patients.length === 0);
  const [values, setValues] = useState<AppointmentFormValues>({
    patientId: patients[0]?.id ?? '',
    firstName: '',
    lastName: '',
    phone: '',
    doctorId: doctors[0]?.id ?? '',
    subject: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    startTime: '',
    endTime: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof AppointmentFormValues, string>>>({});

  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const setField = <K extends keyof AppointmentFormValues>(key: K, value: AppointmentFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  useEffect(() => {
    if (!values.doctorId || !values.date) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    setSlotsError(null);
    // A stale time from a previous doctor/date shouldn't be submitted.
    setValues((v) => ({ ...v, startTime: '', endTime: '' }));
    getAvailableSlots(values.doctorId, values.date)
      .then((res) => {
        if (!cancelled) setSlots(res);
      })
      .catch(() => {
        if (!cancelled) {
          setSlots([]);
          setSlotsError(tCommon('genericError'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.doctorId, values.date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validate(values, {
      doctorId: [required(tv('selectDoctor'))],
      date: [required(tv('required'))],
      startTime: [required(t('selectSlotFirst'))],
      subject: [maxLength(200, tv('maxLength', { max: 200 }))],
      description: [maxLength(2000, tv('maxLength', { max: 2000 }))],
      ...(isNewPatient
        ? {
            firstName: [required(tv('required')), minLength(2, tv('minLength', { min: 2 }))],
            lastName: [required(tv('required')), minLength(2, tv('minLength', { min: 2 }))],
            phone: [required(tv('required')), isPhone(tv('invalidPhone'))],
          }
        : { patientId: [required(tv('selectPatient'))] }),
    });
    setErrors(newErrors);
    if (hasErrors(newErrors)) return;

    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="flex w-full flex-col gap-1.5">
        <label className="text-xs font-semibold tracking-tight text-text-main">
          {t('patient')}
        </label>
        <div className="inline-flex rounded-lg border border-border bg-surface-bg p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setIsNewPatient(false);
              setValues((v) => ({ ...v, firstName: '', lastName: '', phone: '' }));
              setErrors((e) => ({ ...e, firstName: undefined, lastName: undefined, phone: undefined }));
            }}
            disabled={patients.length === 0}
            className={`rounded-md px-3 py-1.5 transition-all disabled:cursor-not-allowed disabled:opacity-40 ${!isNewPatient ? 'bg-surface-card text-text-main shadow-subtle' : 'text-text-muted'
              }`}
          >
            {t('existingPatient')}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsNewPatient(true);
              setValues((v) => ({ ...v, patientId: '' }));
              setErrors((e) => ({ ...e, patientId: undefined }));
            }}
            className={`rounded-md px-3 py-1.5 transition-all ${isNewPatient ? 'bg-surface-card text-text-main shadow-subtle' : 'text-text-muted'
              }`}
          >
            {t('newPatient')}
          </button>
        </div>
      </div>

      {isNewPatient ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('firstName')}
            required
            value={values.firstName}
            onChange={(e) => setField('firstName', e.target.value)}
            errorMessage={errors.firstName}
          />
          <Input
            label={t('lastName')}
            required
            value={values.lastName}
            onChange={(e) => setField('lastName', e.target.value)}
            errorMessage={errors.lastName}
          />
          <Input
            label={t('phone')}
            type="tel"
            required
            className="sm:col-span-2"
            value={values.phone}
            onChange={(e) => setField('phone', e.target.value)}
            errorMessage={errors.phone}
          />
        </div>
      ) : (
        <Select
          value={values.patientId}
          onChange={(v) => setField('patientId', v)}
          options={patients.map((patient) => ({
            value: patient.id,
            label: `${patient.firstName} ${patient.lastName} — ${patient.phone}`,
          }))}
          errorMessage={errors.patientId}
        />
      )}

      <Select
        label={t('doctor')}
        value={values.doctorId}
        onChange={(v) => setField('doctorId', v)}
        placeholder={t('noDoctors')}
        options={doctors.map((doctor) => ({
          value: doctor.id,
          label: `${doctor.firstName} ${doctor.lastName}`,
        }))}
        errorMessage={errors.doctorId}
      />

      <DatePicker
        label={t('date')}
        value={values.date}
        onChange={(v) => setField('date', v)}
        errorMessage={errors.date}
      />

      <div className="flex w-full flex-col gap-1.5">
        <label className="text-xs font-semibold tracking-tight text-text-main">
          {t('availableSlots')}
        </label>
        {loadingSlots ? (
          <div className="flex justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : slotsError ? (
          <p className="text-xs text-status-rejected-fg">{slotsError}</p>
        ) : slots.length === 0 ? (
          <p className="text-xs text-text-dimmed">{t('noSlots')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => {
              const isSelected =
                values.startTime === slot.startTime && values.date === slot.date.slice(0, 10);
              return (
                <button
                  key={slot.startTime}
                  type="button"
                  onClick={() => {
                    setField('startTime', slot.startTime);
                    setField('endTime', slot.endTime);
                  }}
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
        {errors.startTime && (
          <p className="mt-0.5 text-xs text-status-rejected-fg">{errors.startTime}</p>
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
        value={values.description}
        onChange={(e) => setField('description', e.target.value)}
        rows={2}
        maxLength={2000}
        errorMessage={errors.description}
      />

      {errorMessage && (
        <div
          role="alert"
          className="rounded-md border border-status-rejected-fg/20 bg-status-rejected-bg px-3 py-2 text-sm text-status-rejected-fg"
        >
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button type="submit" isLoading={submitting} disabled={doctors.length === 0}>
          {t('create')}
        </Button>
      </div>
    </form>
  );
}
