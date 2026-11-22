'use client';

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { login } from '@/services';
import { ApiError } from '@/lib/api-client';
import { hasErrors, isEmail, minLength, required, validate } from '@/lib/validation';

export const LoginForm = () => {
  const t = useTranslations('auth.login');
  const tv = useTranslations('common.validation');
  const locale = useLocale();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    const newErrors = validate(
      { email, password },
      {
        email: [required(tv('required')), isEmail(tv('invalidEmail'))],
        password: [required(tv('required')), minLength(6, tv('minLength', { min: 6 }))],
      },
    );
    setErrors(newErrors);
    if (hasErrors(newErrors)) return;

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      router.replace(`/${locale}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : t('genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full space-y-4">
      <Input
        label={t('email')}
        name="email"
        type="email"
        placeholder="name@company.com"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setErrors((err) => ({ ...err, email: undefined }));
        }}
        errorMessage={errors.email}
      />

      <Input
        label={t('password')}
        name="password"
        type="password"
        placeholder="••••••••"
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setErrors((err) => ({ ...err, password: undefined }));
        }}
        errorMessage={errors.password}
      />

      {errorMessage && (
        <div
          role="alert"
          className="rounded-md border border-status-rejected-fg/20 bg-status-rejected-bg px-3 py-2 text-sm text-status-rejected-fg"
        >
          {errorMessage}
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="w-full font-medium">
        {isLoading ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
};
