'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { ProtectedImage } from '@/components/ui/ProtectedImage';
import { serviceImageUrl } from '@/services';
import { hasErrors, isPositiveNumber, maxLength, minLength, required, validate } from '@/lib/validation';
import type { Service } from '@/types/domain';

export interface ServiceFormValues {
  name: string;
  description: string;
  duration: string;
  order: string;
}

interface ServiceFormProps {
  initialService?: Service | null;
  onSubmit: (values: ServiceFormValues, imageFile: File | null) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  errorMessage?: string | null;
}

export function ServiceForm({
  initialService,
  onSubmit,
  onCancel,
  submitting,
  errorMessage,
}: ServiceFormProps) {
  const t = useTranslations('services.form');
  const tv = useTranslations('common.validation');
  const isEdit = Boolean(initialService);

  const [values, setValues] = useState<ServiceFormValues>({
    name: initialService?.name ?? '',
    description: initialService?.description ?? '',
    duration: initialService?.duration !== undefined && initialService.duration !== null
      ? String(initialService.duration)
      : '',
    order: initialService?.order !== undefined ? String(initialService.order) : '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ServiceFormValues, string>>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const setField = <K extends keyof ServiceFormValues>(key: K, value: ServiceFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validate(values, {
      name: [required(tv('required')), minLength(2, tv('minLength', { min: 2 })), maxLength(100, tv('maxLength', { max: 100 }))],
      description: [maxLength(1000, tv('maxLength', { max: 1000 }))],
      duration: [isPositiveNumber(tv('positiveNumber'))],
    });
    setErrors(newErrors);
    if (hasErrors(newErrors)) return;

    await onSubmit(values, imageFile);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="flex items-center gap-4">
        {imagePreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagePreview}
            alt=""
            className="h-16 w-16 rounded-lg border border-border object-cover"
          />
        ) : (
          <ProtectedImage
            url={initialService?.image ? serviceImageUrl(initialService.image, 'm') : null}
            alt=""
            className="h-16 w-16 rounded-lg border border-border"
          />
        )}
        <label className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface-card px-3 py-1.5 text-xs font-semibold text-text-main transition-colors hover:bg-surface-bg">
          <Upload className="h-3.5 w-3.5" />
          {t('uploadImage')}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleImageChange}
          />
        </label>
      </div>

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t('duration')}
          type="number"
          min="1"
          value={values.duration}
          onChange={(e) => setField('duration', e.target.value)}
          placeholder={t('durationPlaceholder')}
          errorMessage={errors.duration}
        />
        <Input
          label={t('order')}
          type="number"
          min="0"
          value={values.order}
          onChange={(e) => setField('order', e.target.value)}
        />
      </div>

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
