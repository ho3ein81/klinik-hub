'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Building2, MapPin, Save, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProtectedImage } from '@/components/ui/ProtectedImage';
import { clinicImageUrl } from '@/services';
import { hasErrors, required, validate } from '@/lib/validation';
import type { Clinic } from '@/types/domain';

interface ClinicFormProps {
  clinic: Clinic;
  onSave: (
    input: { name: string; description?: string; address?: string },
    imageFile: File | null,
  ) => Promise<void>;
  saving?: boolean;
}

export function ClinicForm({ clinic, onSave, saving }: ClinicFormProps) {
  const t = useTranslations('settings');
  const tv = useTranslations('common.validation');
  const [name, setName] = useState(clinic.name);
  const [address, setAddress] = useState(clinic.address ?? '');
  const [description, setDescription] = useState(clinic.description ?? '');
  const [nameError, setNameError] = useState<string | undefined>();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    setName(clinic.name);
    setAddress(clinic.address ?? '');
    setDescription(clinic.description ?? '');
    setImageFile(null);
    setImagePreview(null);
  }, [clinic]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validate({ name }, { name: [required(tv('required'))] });
    setNameError(newErrors.name);
    if (hasErrors(newErrors)) return;

    await onSave({ name, address, description }, imageFile);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border border-border bg-surface-card p-5 shadow-subtle sm:p-6"
    >
      <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-text-main">{t('sections.clinicDetails')}</h3>
        </div>
        <Button type="submit" size="sm" isLoading={saving} className="w-full sm:w-auto">
          <Save className="h-3.5 w-3.5" />
          <span>{t('saveChanges')}</span>
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t('fields.clinicImage')}
          </label>
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
                url={clinic.image ? clinicImageUrl(clinic.image, 'm') : null}
                alt=""
                className="h-16 w-16 rounded-lg border border-border"
              />
            )}
            <label className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface-card px-3 py-1.5 text-xs font-semibold text-text-main transition-colors hover:bg-surface-bg">
              <Upload className="h-3.5 w-3.5" />
              {t('actions.uploadImage')}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t('fields.clinicName')}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError(undefined);
            }}
            required
            className={`w-full rounded-lg border bg-surface-bg px-3.5 py-2.5 text-sm text-text-main transition-all focus:bg-surface-card focus:outline-none focus:ring-1 ${nameError
                ? 'border-status-rejected-fg focus:border-status-rejected-fg focus:ring-status-rejected-bg'
                : 'border-border focus:border-primary focus:ring-primary'
              }`}
          />
          {nameError && <p className="mt-1 text-xs text-status-rejected-fg">{nameError}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t('fields.clinicAddress')}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute left-3.5 top-3 text-text-dimmed">
              <MapPin className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-bg py-2.5 pl-10 pr-3.5 text-sm text-text-main transition-all focus:border-primary focus:bg-surface-card focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t('fields.clinicDescription')}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-border bg-surface-bg px-3.5 py-2.5 text-sm text-text-main transition-all focus:border-primary focus:bg-surface-card focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
    </form>
  );
}
