'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarCheck, Mail, Phone, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { ClinicForm, ContactForm, type ContactFormValues } from '@/components/forms';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useApiList } from '@/hooks/useApiList';
import {
  createClinicContact,
  deleteClinicContact,
  getClinic,
  getClinicSetting,
  listClinicContacts,
  updateClinic,
  updateClinicContact,
  updateClinicSetting,
} from '@/services';
import { getCurrentUser } from '@/lib/auth';
import { ApiError } from '@/lib/api-client';
import type { Clinic, ClinicContact, ClinicSetting, ContactType } from '@/types/domain';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [clinicLoading, setClinicLoading] = useState(true);
  const [clinicSaving, setClinicSaving] = useState(false);
  const [clinicError, setClinicError] = useState<string | null>(null);

  const isAdmin = getCurrentUser()?.type === 'ADMIN';
  const [bookingSetting, setBookingSetting] = useState<ClinicSetting | null>(null);
  const [bookingLoading, setBookingLoading] = useState(true);
  const [bookingSaving, setBookingSaving] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const {
    data: contacts,
    loading: contactsLoading,
    error: contactsError,
    refetch,
  } = useApiList<ClinicContact>({
    fetcher: listClinicContacts,
    page: 1,
    limit: 50,
  });

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;
    getClinic(user.clinicId)
      .then(setClinic)
      .catch(() => setClinicError(tCommon('genericError')))
      .finally(() => setClinicLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      setBookingLoading(false);
      return;
    }
    getClinicSetting()
      .then(setBookingSetting)
      .catch(() => setBookingError(tCommon('genericError')))
      .finally(() => setBookingLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleToggle = async (field: 'allowPatientBooking' | 'showArticle') => {
    if (!bookingSetting) return;
    setBookingSaving(true);
    setBookingError(null);
    try {
      const updated = await updateClinicSetting({
        [field]: !bookingSetting[field],
      });
      setBookingSetting(updated);
    } catch (err) {
      setBookingError(err instanceof ApiError ? err.message : tCommon('genericError'));
    } finally {
      setBookingSaving(false);
    }
  };

  const handleClinicSave = async (
    input: { name: string; description?: string; address?: string },
    imageFile: File | null,
  ) => {
    if (!clinic) return;
    setClinicSaving(true);
    setClinicError(null);
    try {
      const updated = await updateClinic(clinic.id, input, imageFile);
      setClinic(updated);
    } catch (err) {
      setClinicError(err instanceof ApiError ? err.message : tCommon('genericError'));
    } finally {
      setClinicSaving(false);
    }
  };

  const phones = contacts.filter((c) => c.contactType === 'PHONE');
  const emails = contacts.filter((c) => c.contactType === 'EMAIL');

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader title={t('title')} description={t('description')} />

      {clinicLoading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : clinic ? (
        <ClinicForm clinic={clinic} onSave={handleClinicSave} saving={clinicSaving} />
      ) : null}

      {clinicError && (
        <div
          role="alert"
          className="rounded-md border border-status-rejected-fg/20 bg-status-rejected-bg px-3 py-2 text-sm text-status-rejected-fg"
        >
          {clinicError}
        </div>
      )}

      {contactsError && (
        <div
          role="alert"
          className="rounded-md border border-status-rejected-fg/20 bg-status-rejected-bg px-3 py-2 text-sm text-status-rejected-fg"
        >
          {contactsError}
        </div>
      )}

      {isAdmin && (
        <div className="space-y-4 rounded-xl border border-border bg-surface-card p-5 shadow-subtle sm:p-6">
          <div className="flex items-start gap-2 border-b border-border pb-3">
            <CalendarCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-text-main">{t('bookingSettings.title')}</h3>
              <p className="mt-0.5 text-xs text-text-muted">{t('bookingSettings.subtitle')}</p>
            </div>
          </div>

          {bookingLoading ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : bookingSetting ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-xl">
                  <p className="text-sm font-medium text-text-main">{t('bookingSettings.allowLabel')}</p>
                  <p className="mt-1 text-xs text-text-muted">{t('bookingSettings.allowDescription')}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={bookingSetting.allowPatientBooking}
                  disabled={bookingSaving}
                  onClick={() => handleToggle('allowPatientBooking')}
                  className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                    bookingSetting.allowPatientBooking ? 'bg-primary' : 'bg-border'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-surface-card shadow-subtle transition-transform ${
                      bookingSetting.allowPatientBooking ? 'translate-x-8' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-xl">
                  <p className="text-sm font-medium text-text-main">{t('bookingSettings.showArticleLabel')}</p>
                  <p className="mt-1 text-xs text-text-muted">{t('bookingSettings.showArticleDescription')}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={bookingSetting.showArticle}
                  disabled={bookingSaving}
                  onClick={() => handleToggle('showArticle')}
                  className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
                    bookingSetting.showArticle ? 'bg-primary' : 'bg-border'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-surface-card shadow-subtle transition-transform ${
                      bookingSetting.showArticle ? 'translate-x-8' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          ) : null}

          {bookingError && (
            <div
              role="alert"
              className="rounded-md border border-status-rejected-fg/20 bg-status-rejected-bg px-3 py-2 text-sm text-status-rejected-fg"
            >
              {bookingError}
            </div>
          )}
        </div>
      )}

      <ContactSection
        icon={<Phone className="h-5 w-5 text-primary" />}
        title={t('sections.phoneNumbers')}
        subtitle={t('sections.phoneSubtitle')}
        addLabel={t('actions.addPhone')}
        type="PHONE"
        contacts={phones}
        loading={contactsLoading}
        onChanged={refetch}
      />

      <ContactSection
        icon={<Mail className="h-5 w-5 text-primary" />}
        title={t('sections.emailAddresses')}
        subtitle={t('sections.emailSubtitle')}
        addLabel={t('actions.addEmail')}
        type="EMAIL"
        contacts={emails}
        loading={contactsLoading}
        onChanged={refetch}
      />
    </div>
  );
}

function ContactSection({
  icon,
  title,
  subtitle,
  addLabel,
  type,
  contacts,
  loading,
  onChanged,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  addLabel: string;
  type: ContactType;
  contacts: ClinicContact[];
  loading: boolean;
  onChanged: () => void;
}) {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClinicContact | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClinicContact | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (contact: ClinicContact) => {
    setEditing(contact);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (values: ContactFormValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editing) {
        await updateClinicContact(editing.id, values);
      } else {
        await createClinicContact(values);
      }
      setModalOpen(false);
      onChanged();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : tCommon('genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteClinicContact(deleteTarget.id);
      setDeleteTarget(null);
      onChanged();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5 rounded-xl border border-border bg-surface-card p-5 shadow-subtle sm:p-6">
      {/* Stacks on mobile: side by side, "Add phone number" was squeezed into
          a three-line button. Matches the ClinicForm header above it. */}
      <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 shrink-0">{icon}</span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-text-main">{title}</h3>
            <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-primary-tint px-3 py-2 text-xs font-semibold text-primary transition-all hover:opacity-90 sm:w-auto sm:py-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{addLabel}</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : contacts.length === 0 ? (
        <p className="py-4 text-center text-sm text-text-muted">{tCommon('noData')}</p>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`flex flex-col gap-3 rounded-xl border p-3.5 transition-all sm:flex-row sm:items-center ${
                contact.isPrimary
                  ? 'border-primary/40 bg-primary-tint/20'
                  : 'border-border bg-surface-bg/50'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text-main">{contact.value}</div>
                <div className="truncate text-xs text-text-dimmed">{contact.name}</div>
              </div>
              <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                {contact.isPrimary && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-surface-card">
                    <CheckCircle2 className="h-3 w-3" />
                    {t('fields.primaryBadge')}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(contact)}
                    title={tCommon('edit')}
                    className="rounded-md p-1.5 text-text-dimmed transition-colors hover:bg-surface-card hover:text-text-main"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(contact)}
                    title={tCommon('delete')}
                    className="rounded-md p-1.5 text-text-dimmed transition-colors hover:bg-status-rejected-bg hover:text-status-rejected-fg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => (!submitting ? setModalOpen(false) : undefined)}
        title={editing ? t('contactForm.editTitle') : t('contactForm.addTitle')}
      >
        <ContactForm
          initialContact={editing}
          fixedType={type}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          submitting={submitting}
          errorMessage={formError}
        />
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => (!deleting ? setDeleteTarget(null) : undefined)}
        title={t('contactForm.confirmDeleteTitle')}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              {tCommon('cancel')}
            </Button>
            <Button variant="danger" onClick={confirmDelete} isLoading={deleting}>
              {tCommon('delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-muted">
          {t('contactForm.confirmDeleteMessage', { value: deleteTarget?.value ?? '' })}
        </p>
      </Modal>
    </div>
  );
}
