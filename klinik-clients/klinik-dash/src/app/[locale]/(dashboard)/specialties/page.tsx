'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Edit2, Plus, Power, Stethoscope, Trash2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { SpecialtyForm, type SpecialtyFormValues } from '@/components/forms';
import { useApiList } from '@/hooks/useApiList';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import {
  activateSpecialty,
  createSpecialty,
  deactivateSpecialty,
  deleteSpecialty,
  listSpecialties,
  updateSpecialty,
} from '@/services';
import { ApiError } from '@/lib/api-client';
import type { Specialty } from '@/types/domain';

export default function SpecialtiesPage() {
  const t = useTranslations('specialties');
  const tCommon = useTranslations('common');

  const { page, limit, setPage } = usePagination(1, 10);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data, meta, loading, error, refetch } = useApiList<Specialty>({
    fetcher: listSpecialties,
    page,
    limit,
  });

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return data;
    return data.filter(
      (specialty) =>
        specialty.name.toLowerCase().includes(term) ||
        (specialty.description ?? '').toLowerCase().includes(term)
    );
  }, [data, debouncedSearch]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Specialty | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const openCreate = () => {
    setEditingSpecialty(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (specialty: Specialty) => {
    setEditingSpecialty(specialty);
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const handleSubmit = async (values: SpecialtyFormValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const input = {
        name: values.name,
        description: values.description || undefined,
      };
      if (editingSpecialty) {
        await updateSpecialty(editingSpecialty.id, input);
      } else {
        await createSpecialty(input);
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : tCommon('genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (specialty: Specialty) => {
    setPendingIds((prev) => new Set(prev).add(specialty.id));
    try {
      if (specialty.isActive) {
        await deactivateSpecialty(specialty.id);
      } else {
        await activateSpecialty(specialty.id);
      }
      refetch();
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(specialty.id);
        return next;
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSpecialty(deleteTarget.id);
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
          <span>{t('addSpecialty')}</span>
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
      ) : filtered.length === 0 ? (
        <EmptyState message={tCommon('noData')} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filtered.map((specialty) => (
              <div
                key={specialty.id}
                className="space-y-3 rounded-xl border border-border bg-surface-card p-4 shadow-subtle"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary">
                      <Stethoscope className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate font-semibold text-text-main">{specialty.name}</h4>
                      {specialty.description && (
                        <span className="block truncate text-xs text-text-dimmed">
                          {specialty.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant={specialty.isActive ? 'success' : 'neutral'}>
                    {specialty.isActive ? t('status.active') : t('status.inactive')}
                  </Badge>
                </div>
                <div className="flex items-center justify-end gap-1 border-t border-border pt-2.5">
                  <button
                    type="button"
                    title={t('actions.edit')}
                    onClick={() => openEdit(specialty)}
                    className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-text-main"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title={specialty.isActive ? tCommon('deactivate') : tCommon('activate')}
                    onClick={() => toggleActive(specialty)}
                    disabled={pendingIds.has(specialty.id)}
                    className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-text-main disabled:opacity-40"
                  >
                    <Power className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title={t('actions.delete')}
                    onClick={() => setDeleteTarget(specialty)}
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
                    <th className="px-4 py-3.5 xl:px-6">{t('table.description')}</th>
                    <th className="px-4 py-3.5 xl:px-6">{t('table.status')}</th>
                    <th className="px-4 py-3.5 text-right xl:px-6">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((specialty) => (
                    <tr key={specialty.id} className="transition-colors hover:bg-surface-bg/50">
                      <td className="px-4 py-4 xl:px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-tint text-primary">
                            <Stethoscope className="h-4.5 w-4.5" />
                          </div>
                          <span className="font-medium text-text-main">{specialty.name}</span>
                        </div>
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-4 text-text-muted xl:max-w-xs xl:px-6">
                        {specialty.description ?? '—'}
                      </td>
                      <td className="px-4 py-4 xl:px-6">
                        <Badge variant={specialty.isActive ? 'success' : 'neutral'}>
                          {specialty.isActive ? t('status.active') : t('status.inactive')}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 xl:px-6">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title={t('actions.edit')}
                            onClick={() => openEdit(specialty)}
                            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-text-main"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title={specialty.isActive ? tCommon('deactivate') : tCommon('activate')}
                            onClick={() => toggleActive(specialty)}
                            disabled={pendingIds.has(specialty.id)}
                            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-text-main disabled:opacity-40"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title={t('actions.delete')}
                            onClick={() => setDeleteTarget(specialty)}
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
        title={editingSpecialty ? t('editSpecialty') : t('addSpecialty')}
      >
        <SpecialtyForm
          initialSpecialty={editingSpecialty}
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
          {t('confirmDelete.message', { name: deleteTarget?.name ?? '' })}
        </p>
      </Modal>
    </div>
  );
}
