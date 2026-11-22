'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { hasErrors, isEmail, isPhone, minLength, required, validate } from '@/lib/validation';
import type { ClinicUser, ClinicUserType, Specialty } from '@/types/domain';

export interface UserFormValues {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  type: ClinicUserType;
  specialtyIds: string[];
}

interface UserFormProps {
  initialUser?: ClinicUser | null;
  specialties: Specialty[];
  onSubmit: (values: UserFormValues, avatarFile: File | null, avatarDelete: boolean) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  errorMessage?: string | null;
}

export function UserForm({
  initialUser,
  specialties,
  onSubmit,
  onCancel,
  submitting,
  errorMessage,
}: UserFormProps) {
  const t = useTranslations('users.form');
  const tv = useTranslations('common.validation');
  const isEdit = Boolean(initialUser);

  const [values, setValues] = useState<UserFormValues>({
    email: initialUser?.email ?? '',
    firstName: initialUser?.firstName ?? '',
    lastName: initialUser?.lastName ?? '',
    phone: initialUser?.phone ?? '',
    password: '',
    type: initialUser?.type ?? 'RECEPTIONIST',
    specialtyIds: initialUser?.specialties?.map((s) => s.id) ?? [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormValues, string>>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarDelete, setAvatarDelete] = useState(false);

  const setField = <K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) => {
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

  const showExistingAvatar = Boolean(initialUser?.avatar) && !avatarDelete && !avatarPreview;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validate(values, {
      firstName: [required(tv('required')), minLength(2, tv('minLength', { min: 2 }))],
      lastName: [required(tv('required')), minLength(2, tv('minLength', { min: 2 }))],
      email: [required(tv('required')), isEmail(tv('invalidEmail'))],
      phone: [required(tv('required')), isPhone(tv('invalidPhone'))],
      ...(!isEdit && { password: [required(tv('required')), minLength(6, tv('minLength', { min: 6 }))] }),
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
            avatar={showExistingAvatar ? (initialUser?.avatar ?? null) : null}
            size="lg"
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
        label={t('email')}
        type="email"
        required
        value={values.email}
        onChange={(e) => setField('email', e.target.value)}
        errorMessage={errors.email}
      />

      <Input
        label={t('phone')}
        type="tel"
        required
        value={values.phone}
        onChange={(e) => setField('phone', e.target.value)}
        placeholder="+41 71 000 00 00"
        errorMessage={errors.phone}
      />

      <Select
        label={t('role')}
        value={values.type}
        onChange={(v) => {
          const type = v as ClinicUserType;
          setValues((prev) => ({
            ...prev,
            type,
            specialtyIds: type === 'DOCTOR' ? prev.specialtyIds : [],
          }));
        }}
        options={[
          { value: 'DOCTOR', label: t('roles.doctor') },
          { value: 'NURSE', label: t('roles.nurse') },
          { value: 'RECEPTIONIST', label: t('roles.receptionist') },
          { value: 'ADMIN', label: t('roles.admin') },
        ]}
      />

      {values.type === 'DOCTOR' && (
        <div className="flex w-full flex-col gap-1.5">
          <label className="text-xs font-semibold tracking-tight text-text-main">
            {t('specialties')}
          </label>
          {specialties.length === 0 ? (
            <p className="text-xs text-text-dimmed">{t('noSpecialties')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {specialties.map((specialty) => {
                const checked = values.specialtyIds.includes(specialty.id);
                return (
                  <button
                    key={specialty.id}
                    type="button"
                    onClick={() =>
                      setValues((v) => ({
                        ...v,
                        specialtyIds: checked
                          ? v.specialtyIds.filter((id) => id !== specialty.id)
                          : [...v.specialtyIds, specialty.id],
                      }))
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${checked
                        ? 'border-primary bg-primary-tint text-primary'
                        : 'border-border bg-surface-card text-text-muted hover:bg-surface-bg'
                      }`}
                  >
                    {specialty.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!isEdit && (
        <Input
          label={t('password')}
          type="password"
          required
          minLength={6}
          helperText={errors.password ? undefined : t('passwordHint')}
          value={values.password}
          onChange={(e) => setField('password', e.target.value)}
          errorMessage={errors.password}
        />
      )}

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
