'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CalendarOff, Clock, Edit2, Plus, Power, Trash2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import {
  DoctorAvailabilityForm,
  type DoctorAvailabilityFormValues,
  DoctorBlockedTimeForm,
  type DoctorBlockedTimeFormValues,
} from '@/components/forms';
import { useApiList } from '@/hooks/useApiList';
import {
  activateDoctorAvailability,
  createDoctorAvailability,
  createDoctorBlockedTime,
  deactivateDoctorAvailability,
  deleteDoctorAvailability,
  deleteDoctorBlockedTime,
  listClinicUsers,
  listDoctorAvailabilities,
  listDoctorBlockedTimes,
  updateDoctorAvailability,
} from '@/services';
import { ApiError } from '@/lib/api-client';
import { getCurrentUser } from '@/lib/auth';
import { fullName } from '@/lib/utils';
import type {
  ClinicUser,
  DayOfWeek,
  DoctorAvailability,
  DoctorBlockedTime,
} from '@/types/domain';

const dayOrder: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export default function DoctorAvailabilitiesPage() {
  const t = useTranslations('doctorAvailabilities');
  const tCommon = useTranslations('common');
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.type === 'ADMIN';
  const isAllowed = currentUser?.type === 'ADMIN' || currentUser?.type === 'DOCTOR';

  const { data, loading, error, refetch } = useApiList<DoctorAvailability>({
    fetcher: (params) => listDoctorAvailabilities({ ...params, limit: 100 }),
    page: 1,
    limit: 100,
  });

  const [doctors, setDoctors] = useState<ClinicUser[]>([]);

  useEffect(() => {
    if (!isAllowed) return;
    if (isAdmin) {
      listClinicUsers({ page: 1, limit: 100, type: 'DOCTOR' })
        .then((res) => setDoctors(res.data))
        .catch(() => setDoctors([]));
    } else if (currentUser) {
      setDoctors([currentUser]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isAllowed]);

  const doctorNameById = new Map(doctors.map((d) => [d.id, `${d.firstName} ${d.lastName}`]));

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<DoctorAvailability | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DoctorAvailability | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const {
    data: blockedTimes,
    loading: blockedTimesLoading,
    error: blockedTimesError,
    refetch: refetchBlockedTimes,
  } = useApiList<DoctorBlockedTime>({
    fetcher: (params) => listDoctorBlockedTimes({ ...params, limit: 100 }),
    page: 1,
    limit: 100,
  });

  const [blockedModalOpen, setBlockedModalOpen] = useState(false);
  const [blockedSubmitting, setBlockedSubmitting] = useState(false);
  const [blockedFormError, setBlockedFormError] = useState<string | null>(null);
  const [deleteBlockedTarget, setDeleteBlockedTarget] = useState<DoctorBlockedTime | null>(null);
  const [deletingBlocked, setDeletingBlocked] = useState(false);

  if (!isAllowed) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} description={t('description')} />
        <EmptyState message={t('notAllowed')} />
      </div>
    );
  }

  const openCreate = () => {
    setEditingSlot(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (slot: DoctorAvailability) => {
    setEditingSlot(slot);
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const handleSubmit = async (values: DoctorAvailabilityFormValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const durationSlot = values.durationSlot ? Number(values.durationSlot) : undefined;
      if (editingSlot) {
        await updateDoctorAvailability(editingSlot.id, {
          dayOfWeek: values.dayOfWeek,
          startTime: values.startTime,
          endTime: values.endTime,
          durationSlot,
        });
      } else {
        await createDoctorAvailability({
          doctorId: values.doctorId,
          dayOfWeek: values.dayOfWeek,
          startTime: values.startTime,
          endTime: values.endTime,
          durationSlot,
        });
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : tCommon('genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (slot: DoctorAvailability) => {
    setPendingIds((prev) => new Set(prev).add(slot.id));
    try {
      if (slot.isActive) {
        await deactivateDoctorAvailability(slot.id);
      } else {
        await activateDoctorAvailability(slot.id);
      }
      refetch();
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(slot.id);
        return next;
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoctorAvailability(deleteTarget.id);
      setDeleteTarget(null);
      refetch();
    } finally {
      setDeleting(false);
    }
  };

  const grouped = dayOrder
    .map((day) => ({ day, slots: data.filter((s) => s.dayOfWeek === day) }))
    .filter((g) => g.slots.length > 0);

  const openBlockedCreate = () => {
    setBlockedFormError(null);
    setBlockedModalOpen(true);
  };

  const closeBlockedModal = () => {
    if (blockedSubmitting) return;
    setBlockedModalOpen(false);
  };

  const handleBlockedSubmit = async (values: DoctorBlockedTimeFormValues) => {
    setBlockedSubmitting(true);
    setBlockedFormError(null);
    try {
      await createDoctorBlockedTime({
        doctorId: values.doctorId,
        startDate: values.startDate,
        endDate: values.endDate,
        reason: values.reason || undefined,
      });
      setBlockedModalOpen(false);
      refetchBlockedTimes();
    } catch (err) {
      setBlockedFormError(err instanceof ApiError ? err.message : tCommon('genericError'));
    } finally {
      setBlockedSubmitting(false);
    }
  };

  const confirmDeleteBlocked = async () => {
    if (!deleteBlockedTarget) return;
    setDeletingBlocked(true);
    try {
      await deleteDoctorBlockedTime(deleteBlockedTarget.id);
      setDeleteBlockedTarget(null);
      refetchBlockedTimes();
    } finally {
      setDeletingBlocked(false);
    }
  };

  const formatDateTime = (value: string) => {
    const d = new Date(value);
    return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}, ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}`;
  };

  const sortedBlockedTimes = [...blockedTimes].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          <span>{t('addSlot')}</span>
        </Button>
      </PageHeader>

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
      ) : grouped.length === 0 ? (
        <EmptyState message={tCommon('noData')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {grouped.map(({ day, slots }) => (
            <div
              key={day}
              className="space-y-3 rounded-xl border border-border bg-surface-card p-4 shadow-subtle"
            >
              <h3 className="text-sm font-semibold text-text-main">
                {t(`days.${day.toLowerCase()}`)}
              </h3>
              <div className="space-y-2">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-bg/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      {isAdmin && (
                        <div className="truncate text-xs font-medium text-text-main">
                          {slot.doctorFirstName
                            ? fullName(slot.doctorFirstName, slot.doctorLastName)
                            : (doctorNameById.get(slot.doctorId) ?? '—')}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-text-muted">
                        <Clock className="h-3 w-3 text-text-dimmed" />
                        <span>
                          {slot.startTime} – {slot.endTime}
                        </span>
                        <Badge variant={slot.isActive ? 'success' : 'neutral'} className="ml-1.5">
                          {slot.isActive ? tCommon('active') : tCommon('inactive')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        title={tCommon('edit')}
                        onClick={() => openEdit(slot)}
                        className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-card hover:text-text-main"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title={slot.isActive ? tCommon('deactivate') : tCommon('activate')}
                        onClick={() => toggleActive(slot)}
                        disabled={pendingIds.has(slot.id)}
                        className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-card hover:text-text-main disabled:opacity-40"
                      >
                        <Power className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title={tCommon('delete')}
                        onClick={() => setDeleteTarget(slot)}
                        className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-card hover:text-status-rejected-fg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4 border-t border-border pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-text-main">
              {t('blockedTime.title')}
            </h2>
            <p className="mt-0.5 text-sm text-text-muted">{t('blockedTime.description')}</p>
          </div>
          <Button onClick={openBlockedCreate} variant="outline" className="w-full sm:w-auto">
            <CalendarOff className="h-4 w-4" />
            <span>{t('blockedTime.addBlockedTime')}</span>
          </Button>
        </div>

        {blockedTimesError && (
          <div
            role="alert"
            className="rounded-md border border-status-rejected-fg/20 bg-status-rejected-bg px-4 py-3 text-sm text-status-rejected-fg"
          >
            {blockedTimesError}
          </div>
        )}

        {blockedTimesLoading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : sortedBlockedTimes.length === 0 ? (
          <EmptyState message={tCommon('noData')} />
        ) : (
          <div className="space-y-2">
            {sortedBlockedTimes.map((blocked) => (
              <div
                key={blocked.id}
                className="flex flex-col gap-2 rounded-lg border border-border bg-surface-bg/60 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  {isAdmin && (
                    <div className="truncate text-xs font-medium text-text-main">
                      {blocked.doctorFirstName
                        ? fullName(blocked.doctorFirstName, blocked.doctorLastName)
                        : (doctorNameById.get(blocked.doctorId) ?? '—')}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <CalendarOff className="h-3 w-3 text-text-dimmed" />
                    <span>
                      {formatDateTime(blocked.startDate)} → {formatDateTime(blocked.endDate)}
                    </span>
                  </div>
                  {blocked.reason && (
                    <p className="mt-1 truncate text-xs text-text-dimmed">{blocked.reason}</p>
                  )}
                </div>
                <button
                  type="button"
                  title={tCommon('delete')}
                  onClick={() => setDeleteBlockedTarget(blocked)}
                  className="self-end rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-card hover:text-status-rejected-fg sm:self-auto"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingSlot ? t('editSlot') : t('addSlot')}
      >
        <DoctorAvailabilityForm
          doctors={doctors}
          initialAvailability={editingSlot}
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
        <p className="text-sm text-text-muted">{t('confirmDelete.message')}</p>
      </Modal>

      <Modal
        open={blockedModalOpen}
        onClose={closeBlockedModal}
        title={t('blockedTime.addBlockedTime')}
      >
        <DoctorBlockedTimeForm
          doctors={doctors}
          isAdmin={isAdmin}
          onSubmit={handleBlockedSubmit}
          onCancel={closeBlockedModal}
          submitting={blockedSubmitting}
          errorMessage={blockedFormError}
        />
      </Modal>

      <Modal
        open={Boolean(deleteBlockedTarget)}
        onClose={() => (!deletingBlocked ? setDeleteBlockedTarget(null) : undefined)}
        title={t('blockedTime.confirmDelete.title')}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setDeleteBlockedTarget(null)}
              disabled={deletingBlocked}
            >
              {tCommon('cancel')}
            </Button>
            <Button variant="danger" onClick={confirmDeleteBlocked} isLoading={deletingBlocked}>
              {tCommon('delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-muted">{t('blockedTime.confirmDelete.message')}</p>
      </Modal>
    </div>
  );
}
