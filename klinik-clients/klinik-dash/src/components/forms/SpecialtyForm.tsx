'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { hasErrors, maxLength, minLength, required, validate } from '@/lib/validation';
import type { Specialty } from '@/types/domain';

export interface SpecialtyFormValues {
  name: string;
  description: string;
}

interface SpecialtyFormProps {
  initialSpecialty?: Specialty | null;
  onSubmit: (values: SpecialtyFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  errorMessage?: string | null;
}

export function SpecialtyForm({
  initialSpecialty,
  onSubmit,
  onCancel,
  submitting,
  errorMessage,
}: SpecialtyFormProps) {
  const t = useTranslations('specialties.form');
  const tv = useTranslations('common.validation');
  const isEdit = Boolean(initialSpecialty);

  const [values, setValues] = useState<SpecialtyFormValues>({
    name: initialSpecialty?.name ?? '',
    description: initialSpecialty?.description ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SpecialtyFormValues, string>>>({});

  const setField = <K extends keyof SpecialtyFormValues>(key: K, value: SpecialtyFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validate(values, {
      name: [required(tv('required')), minLength(2, tv('minLength', { min: 2 })), maxLength(100, tv('maxLength', { max: 100 }))],
      description: [maxLength(1000, tv('maxLength', { max: 1000 }))],
    });
    setErrors(newErrors);
    if (hasErrors(newErrors)) return;

    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Input
        label={t('name')}
        required
        minLength={2}
        maxLength={100}
        value={values.name}
        onChange={(e) => setField('name', e.target.value)}
        errorMessage={errors.name}
      />

      <Textarea
        label={t('description')}
        value={values.description}
        onChange={(e) => setField('description', e.target.value)}
        rows={3}
        maxLength={1000}
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
        <Button type="submit" isLoading={submitting}>
          {isEdit ? t('save') : t('create')}
        </Button>
      </div>
    </form>
  );
}
