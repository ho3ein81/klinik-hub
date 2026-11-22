'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { AlertTriangle, KeyRound, Upload, User as UserIcon, X } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { deactivateClinicUser, fetchCurrentUser, updateClinicUser } from '@/services';
import { clearAuthSession, updateStoredUser } from '@/lib/auth';
import { ApiError } from '@/lib/api-client';
import type { ClinicUser } from '@/types/domain';

export default function ProfilePage() {
  const t = useTranslations('profile');
  const tRoles = useTranslations('users.form');
  const locale = useLocale();
  const router = useRouter();

  const [user, setUser] = useState<ClinicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarDelete, setAvatarDelete] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchCurrentUser()
      .then((u) => {
        setUser(u);
        setFirstName(u.firstName);
        setLastName(u.lastName);
        setPhone(u.phone ?? '');
        setEmail(u.email);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await updateClinicUser(
        user.id,
        { firstName, lastName, phone, email },
        avatarFile,
        avatarDelete
      );
      setUser(updated);
      updateStoredUser(updated);
      setAvatarFile(null);
      setAvatarPreview(null);
      setAvatarDelete(false);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('genericError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!user) return;
    setDeactivating(true);
    try {
      await deactivateClinicUser(user.id);
      clearAuthSession();
      router.replace(`/${locale}/auth` as Route);
    } finally {
      setDeactivating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const showExistingAvatar = Boolean(user.avatar) && !avatarDelete && !avatarPreview;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={t('title')} description={t('description')} />

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-border bg-surface-card p-5 shadow-subtle sm:p-6"
      >
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <UserIcon className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-text-main">{t('sections.personalInfo')}</h3>
        </div>

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
              firstName={firstName || '?'}
              lastName={lastName}
              avatar={showExistingAvatar ? user.avatar : null}
              size="lg"
            />
          )}
          <div className="flex flex-col gap-1.5">
            <label className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface-card px-3 py-1.5 text-xs font-semibold text-text-main transition-colors hover:bg-surface-bg">
              <Upload className="h-3.5 w-3.5" />
              {tRoles('uploadAvatar')}
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
                {tRoles('removeAvatar')}
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label={tRoles('firstName')} required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <Input label={tRoles('lastName')} required value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <Input label={tRoles('email')} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label={tRoles('phone')} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />

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
            {t('saveSuccess')}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" isLoading={saving}>
            {t('saveChanges')}
          </Button>
        </div>
      </form>

      <div className="space-y-5 rounded-xl border border-border bg-surface-card p-5 shadow-subtle sm:p-6">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <KeyRound className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-text-main">{t('sections.security')}</h3>
        </div>
        <ChangePasswordForm />
      </div>

      <div className="space-y-4 rounded-xl border border-status-rejected-fg/20 bg-surface-card p-5 shadow-subtle sm:p-6">
        <div className="flex items-center gap-2 border-b border-status-rejected-fg/20 pb-3">
          <AlertTriangle className="h-5 w-5 text-status-rejected-fg" />
          <h3 className="text-base font-semibold text-text-main">{t('sections.dangerZone')}</h3>
        </div>
        <p className="text-sm text-text-muted">{t('deactivateHint')}</p>
        <Button variant="danger" onClick={() => setDeactivateModalOpen(true)}>
          {t('deactivateAccount')}
        </Button>
      </div>

      <Modal
        open={deactivateModalOpen}
        onClose={() => (!deactivating ? setDeactivateModalOpen(false) : undefined)}
        title={t('deactivateAccount')}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDeactivateModalOpen(false)}
              disabled={deactivating}
            >
              {t('confirmDeactivate.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDeactivate} isLoading={deactivating}>
              {t('confirmDeactivate.confirm')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-muted">{t('confirmDeactivate.message')}</p>
      </Modal>
    </div>
  );
}
