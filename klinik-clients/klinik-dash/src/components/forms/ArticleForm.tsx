'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { ProtectedImage } from '@/components/ui/ProtectedImage';
import { articleImageUrl } from '@/services';
import { hasErrors, maxLength, minLength, required, validate } from '@/lib/validation';
import type { Article } from '@/types/domain';

export interface ArticleFormValues {
  title: string;
  content: string;
}

interface ArticleFormProps {
  initialArticle?: Article | null;
  onSubmit: (values: ArticleFormValues, imageFile: File | null) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  errorMessage?: string | null;
}

export function ArticleForm({
  initialArticle,
  onSubmit,
  onCancel,
  submitting,
  errorMessage,
}: ArticleFormProps) {
  const t = useTranslations('articles.form');
  const tv = useTranslations('common.validation');
  const isEdit = Boolean(initialArticle);

  const [values, setValues] = useState<ArticleFormValues>({
    title: initialArticle?.title ?? '',
    content: initialArticle?.content ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ArticleFormValues, string>>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const setField = <K extends keyof ArticleFormValues>(key: K, value: ArticleFormValues[K]) => {
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
      title: [required(tv('required')), minLength(2, tv('minLength', { min: 2 })), maxLength(200, tv('maxLength', { max: 200 }))],
      content: [required(tv('required'))],
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
            url={initialArticle?.image ? articleImageUrl(initialArticle.image, 'm') : null}
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
        label={t('title')}
        required
        minLength={2}
        maxLength={200}
        value={values.title}
        onChange={(e) => setField('title', e.target.value)}
        errorMessage={errors.title}
      />

      <Textarea
        label={t('content')}
        required
        value={values.content}
        onChange={(e) => setField('content', e.target.value)}
        rows={8}
        helperText={t('contentHelper')}
        errorMessage={errors.content}
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
