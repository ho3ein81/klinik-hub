'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Plus, Phone, Calendar, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { PatientForm, type PatientFormValues } from '@/components/forms';
import { useApiList } from '@/hooks/useApiList';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import { createPatient, deletePatient, listPatients, updatePatient } from '@/services';
import { ApiError } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import type { Patient } from '@/types/domain';

export default function PatientsPage() {
  const t = useTranslations('patients');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const { page, limit, setPage } = usePagination(1, 10);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data, meta, loading, error, refetch } = useApiList<Patient>({
    fetcher: (params) => listPatients({ ...params, search: debouncedSearch || undefined }),
    page,
    limit,
    deps: [debouncedSearch],
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditingPatient(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const handleSubmit = async (
    values: PatientFormValues,
    avatarFile: File | null,
    avatarDelete: boolean
  ) => {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editingPatient) {
        await updatePatient(editingPatient.id, values, avatarFile, avatarDelete);
      } else {
        await createPatient(values, avatarFile);
      }
      setModalOpen(false);
      refetch();
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
      await deletePatient(deleteTarget.id);
      setDeleteTarget(null);
      refetch();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          <span>{t('newPatient')}</span>
        </Button>
      </PageHeader>

      <div className="rounded-xl border border-border bg-surface-card p-4 shadow-subtle">
        <SearchInput
          value={searchTerm}
          onChange={(value) => {
            setSearchTerm(value);
            setPage(1);
          }}
          placeholder={t('searchPlaceholder')}
          className="max-w-md"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-status-rejected-fg/20 bg-status-rejected-bg px-4 py-3 text-sm text-status-rejected-fg"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : data.length === 0 ? (
        <EmptyState message={tCommon('noData')} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {data.map((patient) => (
              <div
                key={patient.id}
                className="space-y-3 rounded-xl border border-border bg-surface-card p-4 shadow-subtle"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar firstName={patient.firstName} lastName={patient.lastName} avatar={patient.avatar} kind="patient" />
                    <div className="min-w-0">
                      <h4 className="truncate font-semibold text-text-main">
                        {patient.firstName} {patient.lastName}
                      </h4>
                      {patient.address && (
                        <span className="block truncate text-xs text-text-dimmed">{patient.address}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-y border-border py-2.5 text-xs text-text-muted">
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-text-dimmed" />
                    <span>{patient.phone}</span>
                  </div>
                  {patient.dateOfBirth && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-text-dimmed" />
                      <span>{formatDate(patient.dateOfBirth, locale)}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(patient)}
                    title={tCommon('edit')}
                    className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-text-main"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(patient)}
                    title={tCommon('delete')}
                    className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-status-rejected-fg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-border bg-surface-card shadow-subtle md:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-bg font-medium text-text-muted">
                    <th className="px-4 py-3.5 xl:px-6">{t('table.name')}</th>
                    <th className="px-4 py-3.5 xl:px-6">{t('table.phone')}</th>
                    <th className="px-4 py-3.5 xl:px-6">{t('table.address')}</th>
                    <th className="px-4 py-3.5 xl:px-6">{t('table.dateOfBirth')}</th>
                    <th className="px-4 py-3.5 text-right xl:px-6">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((patient) => (
                    <tr key={patient.id} className="transition-colors hover:bg-surface-bg/50">
                      <td className="px-4 py-4 xl:px-6">
                        <div className="flex items-center gap-3">
                          <Avatar firstName={patient.firstName} lastName={patient.lastName} avatar={patient.avatar} kind="patient" />
                          <span className="font-medium text-text-main">
                            {patient.firstName} {patient.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-text-muted xl:px-6">{patient.phone}</td>
                      <td className="px-4 py-4 text-text-muted xl:px-6">{patient.address ?? '—'}</td>
                      <td className="px-4 py-4 text-text-muted xl:px-6">
                        {patient.dateOfBirth ? formatDate(patient.dateOfBirth, locale) : '—'}
                      </td>
                      <td className="px-4 py-4 xl:px-6">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(patient)}
                            title={tCommon('edit')}
                            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-text-main"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(patient)}
                            title={tCommon('delete')}
                            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-status-rejected-fg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-card px-4 py-3 shadow-subtle">
              <span className="text-xs text-text-muted">
                {tCommon('pageInfo', { page: meta.page, totalPages: meta.totalPages })}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!meta.hasPrevPage}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:bg-surface-bg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={!meta.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:bg-surface-bg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingPatient ? t('editPatient') : t('newPatient')}
      >
        <PatientForm
          initialPatient={editingPatient}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          submitting={submitting}
          errorMessage={formError}
        />
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => (!deleting ? setDeleteTarget(null) : undefined)}
        title={t('confirmDelete.title')}
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
          {t('confirmDelete.message', {
            name: deleteTarget ? `${deleteTarget.firstName} ${deleteTarget.lastName}` : '',
          })}
        </p>
      </Modal>
    </div>
  );
}
