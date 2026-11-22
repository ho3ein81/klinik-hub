'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { hasErrors, required, validate } from '@/lib/validation';
import type { ClinicUser } from '@/types/domain';

export interface DoctorBlockedTimeFormValues {
  doctorId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

interface DoctorBlockedTimeFormProps {
  doctors: ClinicUser[];
  isAdmin: boolean;
  onSubmit: (values: DoctorBlockedTimeFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  errorMessage?: string | null;
}

// A bare `datetime-local` value ("YYYY-MM-DDTHH:mm") has no timezone of its
// own — treat it as the same wall-clock convention the rest of the app uses
// for appointment dates/times by pinning it to UTC explicitly.
function toIsoUtc(localValue: string): string {
  return localValue ? `${localValue}:00.000Z` : '';
}

export function DoctorBlockedTimeForm({
  doctors,
  isAdmin,
  onSubmit,
  onCancel,
  submitting,
  errorMessage,
}: DoctorBlockedTimeFormProps) {
  const t = useTranslations('doctorAvailabilities.blockedTimeForm');
  const tv = useTranslations('common.validation');

  const [values, setValues] = useState<DoctorBlockedTimeFormValues>({
    doctorId: doctors[0]?.id ?? '',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof DoctorBlockedTimeFormValues, string>>>({});

  const setField = <K extends keyof DoctorBlockedTimeFormValues>(
    key: K,
    value: DoctorBlockedTimeFormValues[K],
  ) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validate(values, {
      doctorId: [required(tv('selectDoctor'))],
      startDate: [required(tv('required'))],
      endDate: [required(tv('required'))],
    });
    if (
      !newErrors.endDate &&
      values.startDate &&
      values.endDate &&
      values.startDate >= values.endDate
    ) {
      newErrors.endDate = tv('endAfterStart');
    }
    setErrors(newErrors);
    if (hasErrors(newErrors)) return;

    await onSubmit({
      ...values,
      startDate: toIsoUtc(values.startDate),
      endDate: toIsoUtc(values.endDate),
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {isAdmin && (
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DatePicker
          label={t('startDate')}
          showTime
          value={values.startDate}
          onChange={(v) => setField('startDate', v)}
          errorMessage={errors.startDate}
        />
        <DatePicker
          label={t('endDate')}
          showTime
          value={values.endDate}
          onChange={(v) => setField('endDate', v)}
          errorMessage={errors.endDate}
        />
      </div>

      <Textarea
        label={t('reason')}
        rows={2}
        maxLength={500}
        placeholder={t('reasonPlaceholder')}
        value={values.reason}
        onChange={(e) => setField('reason', e.target.value)}
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
        <Button type="submit" isLoading={submitting} disabled={isAdmin && doctors.length === 0}>
          {t('create')}
        </Button>
      </div>
    </form>
  );
}
