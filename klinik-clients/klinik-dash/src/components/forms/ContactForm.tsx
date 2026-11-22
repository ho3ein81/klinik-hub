'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { hasErrors, isEmail, isPhone, required, validate } from '@/lib/validation';
import type { ClinicContact, ContactType } from '@/types/domain';

export interface ContactFormValues {
  name: string;
  contactType: ContactType;
  value: string;
  isPrimary: boolean;
}

interface ContactFormProps {
  initialContact?: ClinicContact | null;
  fixedType?: ContactType;
  onSubmit: (values: ContactFormValues) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  errorMessage?: string | null;
}

export function ContactForm({
  initialContact,
  fixedType,
  onSubmit,
  onCancel,
  submitting,
  errorMessage,
}: ContactFormProps) {
  const t = useTranslations('settings.contactForm');
  const tv = useTranslations('common.validation');
  const isEdit = Boolean(initialContact);

  const [values, setValues] = useState<ContactFormValues>({
    name: initialContact?.name ?? '',
    contactType: initialContact?.contactType ?? fixedType ?? 'PHONE',
    value: initialContact?.value ?? '',
    isPrimary: initialContact?.isPrimary ?? false,
  });
  const [errors, setErrors] = useState<Partial<Record<'name' | 'value', string>>>({});

  const setField = (key: 'name' | 'value', value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validate(values, {
      name: [required(tv('required'))],
      value: [
        required(tv('required')),
        values.contactType === 'EMAIL' ? isEmail(tv('invalidEmail')) : isPhone(tv('invalidPhone')),
      ],
    });
    setErrors(newErrors);
    if (hasErrors(newErrors)) return;

    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Input
        label={t('label')}
        required
        value={values.name}
        onChange={(e) => setField('name', e.target.value)}
        placeholder={t('labelPlaceholder')}
        errorMessage={errors.name}
      />

      {!fixedType && (
        <Select
          label={t('type')}
          value={values.contactType}
          onChange={(v) => {
            setValues((prev) => ({ ...prev, contactType: v as ContactType, value: '' }));
            setErrors((err) => ({ ...err, value: undefined }));
          }}
          options={[
            { value: 'PHONE', label: t('typePhone') },
            { value: 'EMAIL', label: t('typeEmail') },
          ]}
        />
      )}

      <Input
        label={values.contactType === 'EMAIL' ? t('emailValue') : t('phoneValue')}
        type={values.contactType === 'EMAIL' ? 'email' : 'tel'}
        required
        value={values.value}
        onChange={(e) => setField('value', e.target.value)}
        placeholder={values.contactType === 'EMAIL' ? 'contact@clinic.ch' : '+41 71 000 00 00'}
        errorMessage={errors.value}
      />

      <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-text-main">
        <input
          type="checkbox"
          checked={values.isPrimary}
          onChange={(e) => setValues((v) => ({ ...v, isPrimary: e.target.checked }))}
          className="h-4 w-4 accent-primary"
        />
        {t('setPrimary')}
      </label>

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
          {isEdit ? t('save') : t('add')}
        </Button>
      </div>
    </form>
  );
}
