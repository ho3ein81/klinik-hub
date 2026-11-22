'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { hasErrors, isPhone, maxLength, minLength, required, validate } from '@/lib/validation';
import type { Patient } from '@/types/domain';

export interface PatientFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  dateOfBirth: string;
}

interface PatientFormProps {
  initialPatient?: Patient | null;
  onSubmit: (
    values: PatientFormValues,
    avatarFile: File | null,
    avatarDelete: boolean
  ) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  errorMessage?: string | null;
}

export function PatientForm({
  initialPatient,
  onSubmit,
  onCancel,
  submitting,
  errorMessage,
}: PatientFormProps) {
  const t = useTranslations('patients.form');
  const tv = useTranslations('common.validation');
  const isEdit = Boolean(initialPatient);

  const [values, setValues] = useState<PatientFormValues>({
    firstName: initialPatient?.firstName ?? '',
    lastName: initialPatient?.lastName ?? '',
    phone: initialPatient?.phone ?? '',
    address: initialPatient?.address ?? '',
    dateOfBirth: initialPatient?.dateOfBirth
      ? initialPatient.dateOfBirth.slice(0, 10)
      : '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof PatientFormValues, string>>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarDelete, setAvatarDelete] = useState(false);

  const setField = <K extends keyof PatientFormValues>(key: K, value: PatientFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarDelete(false);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarDelete(true);
  };

  const showExistingAvatar = Boolean(initialPatient?.avatar) && !avatarDelete && !avatarPreview;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validate(values, {
      firstName: [required(tv('required')), minLength(2, tv('minLength', { min: 2 }))],
      lastName: [required(tv('required')), minLength(2, tv('minLength', { min: 2 }))],
      phone: [required(tv('required')), isPhone(tv('invalidPhone'))],
      address: [maxLength(255, tv('maxLength', { max: 255 }))],
    });
    setErrors(newErrors);
    if (hasErrors(newErrors)) return;

    await onSubmit(values, avatarFile, avatarDelete);
  };

  return (
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
            firstName={values.firstName || '?'}
            lastName={values.lastName || ''}
            avatar={showExistingAvatar ? (initialPatient?.avatar ?? null) : null}
            size="lg"
            kind="patient"
          />
        )}
        <div className="flex flex-col gap-1.5">
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
          {showExistingAvatar || avatarFile ? (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="inline-flex w-fit items-center gap-1 text-xs text-status-rejected-fg hover:underline"
            >
              <X className="h-3 w-3" />
              {t('removeAvatar')}
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t('firstName')}
          required
          minLength={2}
          value={values.firstName}
          onChange={(e) => setField('firstName', e.target.value)}
          errorMessage={errors.firstName}
        />
        <Input
          label={t('lastName')}
          required
          minLength={2}
          value={values.lastName}
          onChange={(e) => setField('lastName', e.target.value)}
          errorMessage={errors.lastName}
        />
      </div>

      <Input
        label={t('phone')}
        type="tel"
        required
        value={values.phone}
        onChange={(e) => setField('phone', e.target.value)}
        placeholder="+41 71 000 00 00"
        errorMessage={errors.phone}
      />

      <Input
        label={t('address')}
        maxLength={255}
        value={values.address}
        onChange={(e) => setField('address', e.target.value)}
        errorMessage={errors.address}
      />

      <DatePicker
        label={t('dateOfBirth')}
        value={values.dateOfBirth}
        onChange={(v) => setField('dateOfBirth', v)}
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
