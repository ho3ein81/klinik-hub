'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/Select';
import { TimePicker } from '@/components/ui/TimePicker';
import { Button } from '@/components/ui/Button';
import { hasErrors, isTime, required, validate } from '@/lib/validation';
import type { ClinicUser, DayOfWeek, DoctorAvailability } from '@/types/domain';

const DURATION_OPTIONS = [15, 30, 45, 60] as const;

export interface DoctorAvailabilityFormValues {
  doctorId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  durationSlot: string;
}

const DAYS: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

interface DoctorAvailabilityFormProps {
  doctors: ClinicUser[];
  initialAvailability?: DoctorAvailability | null;
  onSubmit: (values: DoctorAvailabilityFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  errorMessage?: string | null;
}

export function DoctorAvailabilityForm({
  doctors,
  initialAvailability,
  onSubmit,
  onCancel,
  submitting,
  errorMessage,
}: DoctorAvailabilityFormProps) {
  const t = useTranslations('doctorAvailabilities.form');
  const tDays = useTranslations('doctorAvailabilities.days');
  const tv = useTranslations('common.validation');
  const isEdit = Boolean(initialAvailability);

  const [values, setValues] = useState<DoctorAvailabilityFormValues>({
    doctorId: initialAvailability?.doctorId ?? doctors[0]?.id ?? '',
    dayOfWeek: initialAvailability?.dayOfWeek ?? 'MONDAY',
    startTime: initialAvailability?.startTime ?? '09:00',
    endTime: initialAvailability?.endTime ?? '17:00',
    durationSlot:
      initialAvailability?.durationSlot !== undefined
        ? String(initialAvailability.durationSlot)
        : '15',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof DoctorAvailabilityFormValues, string>>>({});

  const setField = <K extends keyof DoctorAvailabilityFormValues>(
    key: K,
    value: DoctorAvailabilityFormValues[K],
  ) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validate(values, {
      doctorId: [required(tv('selectDoctor'))],
      startTime: [required(tv('required')), isTime(tv('invalidTime'))],
      endTime: [required(tv('required')), isTime(tv('invalidTime'))],
    });
    if (
      !newErrors.endTime &&
      values.startTime &&
      values.endTime &&
      values.startTime >= values.endTime
    ) {
      newErrors.endTime = tv('endAfterStart');
    }
    setErrors(newErrors);
    if (hasErrors(newErrors)) return;

    await onSubmit(values);
  };

  const editingDoctor = doctors.find((d) => d.id === values.doctorId);
  const editingDoctorName = initialAvailability?.doctorFirstName
    ? `${initialAvailability.doctorFirstName} ${initialAvailability.doctorLastName ?? ''}`.trim()
    : editingDoctor
      ? `${editingDoctor.firstName} ${editingDoctor.lastName}`
      : '—';

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {isEdit ? (
        <div className="flex w-full flex-col gap-1.5">
          <label className="text-xs font-semibold tracking-tight text-text-main">
            {t('doctor')}
          </label>
          <p className="rounded-lg border border-border bg-surface-bg px-3.5 py-2.5 text-sm text-text-main">
            {editingDoctorName}
          </p>
        </div>
      ) : (
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
      )}

      <Select
        label={t('day')}
        value={values.dayOfWeek}
        onChange={(v) => setField('dayOfWeek', v as DayOfWeek)}
        options={DAYS.map((day) => ({ value: day, label: tDays(day.toLowerCase()) }))}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TimePicker
          label={t('startTime')}
          value={values.startTime}
          onChange={(v) => setField('startTime', v)}
          errorMessage={errors.startTime}
        />
        <TimePicker
          label={t('endTime')}
          value={values.endTime}
          onChange={(v) => setField('endTime', v)}
          errorMessage={errors.endTime}
        />
      </div>

      <Select
        label={t('durationSlot')}
        value={values.durationSlot}
        onChange={(v) => setField('durationSlot', v)}
        options={DURATION_OPTIONS.map((minutes) => ({ value: String(minutes), label: String(minutes) }))}
        helperText={t('durationSlotHint')}
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
        <Button type="submit" isLoading={submitting} disabled={!isEdit && doctors.length === 0}>
          {isEdit ? t('save') : t('create')}
        </Button>
      </div>
    </form>
  );
}
