'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { changePassword } from '@/services';
import { ApiError } from '@/lib/api-client';
import { hasErrors, minLength, required, validate } from '@/lib/validation';

interface ChangePasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function ChangePasswordForm() {
  const t = useTranslations('profile.changePassword');
  const tv = useTranslations('common.validation');

  const [values, setValues] = useState<ChangePasswordValues>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ChangePasswordValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const setField = <K extends keyof ChangePasswordValues>(key: K, value: ChangePasswordValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const newErrors = validate(values, {
      currentPassword: [required(tv('required')), minLength(6, tv('minLength', { min: 6 }))],
      newPassword: [required(tv('required')), minLength(6, tv('minLength', { min: 6 }))],
      confirmPassword: [required(tv('required')), minLength(6, tv('minLength', { min: 6 }))],
    });
    if (
      !newErrors.newPassword &&
      values.currentPassword &&
      values.newPassword &&
      values.newPassword === values.currentPassword
    ) {
      newErrors.newPassword = t('samePassword');
    }
    if (!newErrors.confirmPassword && values.newPassword !== values.confirmPassword) {
      newErrors.confirmPassword = t('mismatch');
    }
    setErrors(newErrors);
    if (hasErrors(newErrors)) return;

    setSubmitting(true);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      setSuccess(true);
      setValues({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Input
        label={t('current')}
        type="password"
        required
        autoComplete="current-password"
        value={values.currentPassword}
        onChange={(e) => setField('currentPassword', e.target.value)}
        errorMessage={errors.currentPassword}
      />
      <Input
        label={t('new')}
        type="password"
        required
        minLength={6}
        autoComplete="new-password"
        value={values.newPassword}
        onChange={(e) => setField('newPassword', e.target.value)}
        errorMessage={errors.newPassword}
      />
      <Input
        label={t('confirm')}
        type="password"
        required
        minLength={6}
        autoComplete="new-password"
        value={values.confirmPassword}
        onChange={(e) => setField('confirmPassword', e.target.value)}
        errorMessage={errors.confirmPassword}
      />

      {error && (
        <div
          role="alert"
          className="rounded-md border border-status-rejected-fg/20 bg-status-rejected-bg px-3 py-2 text-sm text-status-rejected-fg"
        >
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-status-completed-fg/20 bg-status-completed-bg px-3 py-2 text-sm text-status-completed-fg">
          {t('success')}
        </div>
      )}

      <Button type="submit" isLoading={submitting}>
        {t('submit')}
      </Button>
    </form>
  );
}
