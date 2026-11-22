'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Edit2, ImageIcon, Plus, Power, Trash2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProtectedImage } from '@/components/ui/ProtectedImage';
import EmptyState from '@/components/ui/EmptyState';
import { ServiceForm, type ServiceFormValues } from '@/components/forms';
import { useApiList } from '@/hooks/useApiList';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import {
  activateService,
  createService,
  deactivateService,
  deleteService,
  listServices,
  serviceImageUrl,
  updateService,
} from '@/services';
import { ApiError } from '@/lib/api-client';
import type { Service } from '@/types/domain';

export default function ServicesPage() {
  const t = useTranslations('services');
  const tCommon = useTranslations('common');

  const { page, limit, setPage } = usePagination(1, 10);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data, meta, loading, error, refetch } = useApiList<Service>({
    fetcher: listServices,
    page,
    limit,
    sortBy: 'order',
    sortOrder: 'asc',
  });

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return data;
    return data.filter(
      (service) =>
        service.name.toLowerCase().includes(term) ||
        (service.description ?? '').toLowerCase().includes(term)
    );
  }, [data, debouncedSearch]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const openCreate = () => {
    setEditingService(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const handleSubmit = async (values: ServiceFormValues, imageFile: File | null) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const input = {
        name: values.name,
        description: values.description || undefined,
        duration: values.duration ? Number(values.duration) : undefined,
        order: values.order ? Number(values.order) : undefined,
      };
      if (editingService) {
        await updateService(editingService.id, input, imageFile);
      } else {
        await createService(input, imageFile);
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : tCommon('genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (service: Service) => {
    setPendingIds((prev) => new Set(prev).add(service.id));
    try {
      if (service.isActive) {
        await deactivateService(service.id);
      } else {
        await activateService(service.id);
      }
      refetch();
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(service.id);
        return next;
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteService(deleteTarget.id);
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
          <span>{t('addService')}</span>
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
            {filtered.map((service) => (
              <div
                key={service.id}
                className="space-y-3 rounded-xl border border-border bg-surface-card p-4 shadow-subtle"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-bg">
                      {service.image ? (
                        <ProtectedImage
                          url={serviceImageUrl(service.image, 'm')}
                          alt={service.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-text-dimmed">
                          <ImageIcon className="h-4 w-4 stroke-1" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate font-semibold text-text-main">{service.name}</h4>
                      {service.description && (
                        <span className="block truncate text-xs text-text-dimmed">
                          {service.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant={service.isActive ? 'success' : 'neutral'}>
                    {service.isActive ? t('status.active') : t('status.inactive')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between border-y border-border py-2.5 text-xs text-text-muted">
                  <span>
                    {service.price !== null ? `${t('currency')} ${service.price.toFixed(2)}` : '—'}
                  </span>
                  {service.duration && (
                    <span>
                      {service.duration} {t('minutesShort')}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 border-b border-border pb-2 text-xs text-text-muted">
                  <span>{t('table.order')}</span>
                  <span className="font-medium text-text-main">{service.order}</span>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    title={t('actions.edit')}
                    onClick={() => openEdit(service)}
                    className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-text-main"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title={service.isActive ? tCommon('deactivate') : tCommon('activate')}
                    onClick={() => toggleActive(service)}
                    disabled={pendingIds.has(service.id)}
                    className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-text-main disabled:opacity-40"
                  >
                    <Power className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title={t('actions.delete')}
                    onClick={() => setDeleteTarget(service)}
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
                    <th className="px-4 py-3.5 xl:px-6">{t('table.price')}</th>
                    <th className="px-4 py-3.5 xl:px-6">{t('table.duration')}</th>
                    <th className="px-4 py-3.5 xl:px-6">{t('table.order')}</th>
                    <th className="px-4 py-3.5 xl:px-6">{t('table.status')}</th>
                    <th className="px-4 py-3.5 text-right xl:px-6">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((service) => (
                    <tr key={service.id} className="transition-colors hover:bg-surface-bg/50">
                      <td className="px-4 py-4 xl:px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-bg">
                            {service.image ? (
                              <ProtectedImage
                                url={serviceImageUrl(service.image, 'm')}
                                alt={service.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-text-dimmed">
                                <ImageIcon className="h-4 w-4 stroke-1" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-text-main">{service.name}</div>
                            {service.description && (
                              <div className="max-w-[200px] truncate text-xs text-text-dimmed xl:max-w-xs">
                                {service.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-text-muted xl:px-6">
                        {service.price !== null ? `${t('currency')} ${service.price.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-4 text-text-muted xl:px-6">
                        {service.duration ? `${service.duration} ${t('minutesShort')}` : '—'}
                      </td>
                      <td className="px-4 py-4 text-text-muted xl:px-6">{service.order}</td>
                      <td className="px-4 py-4 xl:px-6">
                        <Badge variant={service.isActive ? 'success' : 'neutral'}>
                          {service.isActive ? t('status.active') : t('status.inactive')}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 xl:px-6">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title={t('actions.edit')}
                            onClick={() => openEdit(service)}
                            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-text-main"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title={service.isActive ? tCommon('deactivate') : tCommon('activate')}
                            onClick={() => toggleActive(service)}
                            disabled={pendingIds.has(service.id)}
                            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-text-main disabled:opacity-40"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title={t('actions.delete')}
                            onClick={() => setDeleteTarget(service)}
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
        title={editingService ? t('editService') : t('addService')}
      >
        <ServiceForm
          initialService={editingService}
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
