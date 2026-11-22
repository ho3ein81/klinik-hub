'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Calendar as CalendarIcon, Check, Clock, Plus, UserX, X } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import EmptyState from '@/components/ui/EmptyState';
import { AppointmentForm, type AppointmentFormValues } from '@/components/forms';
import { SearchInput } from '@/components/ui/SearchInput';
import { useApiList } from '@/hooks/useApiList';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import {
  approveAppointment,
  completeAppointment,
  createAppointment,
  listAppointments,
  listClinicUsers,
  listPatients,
  markAppointmentNotShown,
  rejectAppointment,
} from '@/services';
import { ApiError } from '@/lib/api-client';
import { formatDate, fullName } from '@/lib/utils';
import type { Appointment, AppointmentStatus, ClinicUser, Patient } from '@/types/domain';

const statusBadgeVariant: Record<AppointmentStatus, 'success' | 'neutral' | 'danger' | 'warning' | 'primary'> = {
  BOOKED: 'warning',
  APPROVED: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
  REJECTED: 'danger',
  NOT_SHOW: 'danger',
};

const ALL_STATUSES: AppointmentStatus[] = [
  'BOOKED',
  'APPROVED',
  'COMPLETED',
  'CANCELLED',
  'REJECTED',
  'NOT_SHOW',
];

export default function AppointmentsPage() {
  const t = useTranslations('appointments');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const { page, limit, setPage } = usePagination(1, 10);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [patientFilter, setPatientFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data, meta, loading, error, refetch } = useApiList<Appointment>({
    fetcher: (params) =>
      listAppointments({
        ...params,
        status: statusFilter === 'all' ? undefined : statusFilter,
        patientId: patientFilter === 'all' ? undefined : patientFilter,
        doctorId: doctorFilter === 'all' ? undefined : doctorFilter,
        search: debouncedSearch || undefined,
      }),
    page,
    limit,
    sortBy: 'date',
    deps: [statusFilter, patientFilter, doctorFilter, debouncedSearch],
  });

  const [doctors, setDoctors] = useState<ClinicUser[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [rejectTarget, setRejectTarget] = useState<Appointment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    Promise.all([
      listClinicUsers({ page: 1, limit: 100, type: 'DOCTOR' }),
      listPatients({ page: 1, limit: 100 }),
    ]).then(([doctorsRes, patientsRes]) => {
      setDoctors(doctorsRes.data);
      setPatients(patientsRes.data);
    });
  }, []);

  const openCreate = () => {
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const handleSubmit = async (values: AppointmentFormValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      await createAppointment({
        patientId: values.patientId || undefined,
        firstName: values.patientId ? undefined : values.firstName,
        lastName: values.patientId ? undefined : values.lastName,
        phone: values.patientId ? undefined : values.phone,
        doctorId: values.doctorId,
        subject: values.subject || undefined,
        description: values.description || undefined,
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime,
      });
      setModalOpen(false);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : tCommon('genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  const runAction = async (id: string, action: (id: string) => Promise<void>) => {
    setPendingIds((prev) => new Set(prev).add(id));
    try {
      await action(id);
      refetch();
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const openReject = (apt: Appointment) => {
    setRejectTarget(apt);
    setRejectReason('');
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      await rejectAppointment(rejectTarget.id, rejectReason.trim() || undefined);
      setRejectTarget(null);
      refetch();
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          <span>{t('newAppointment')}</span>
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-card p-4 shadow-subtle sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          value={searchTerm}
          onChange={(value) => {
            setSearchTerm(value);
            setPage(1);
          }}
          placeholder={t('searchPlaceholder')}
          className="w-full sm:max-w-xs"
        />
        <div className="flex-1 sm:max-w-xs">
          <Select
            value={patientFilter}
            onChange={(v) => {
              setPatientFilter(v);
              setPage(1);
            }}
            options={[
              { value: 'all', label: t('form.patient') },
              ...patients.map((patient) => ({
                value: patient.id,
                label: `${patient.firstName} ${patient.lastName}`,
              })),
            ]}
          />
        </div>
        <div className="flex-1 sm:max-w-xs">
          <Select
            value={doctorFilter}
            onChange={(v) => {
              setDoctorFilter(v);
              setPage(1);
            }}
            options={[
              { value: 'all', label: t('form.doctor') },
              ...doctors.map((doctor) => ({
                value: doctor.id,
                label: `${doctor.firstName} ${doctor.lastName}`,
              })),
            ]}
          />
        </div>
        <div className="sm:w-56">
          <Select
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v as AppointmentStatus | 'all');
              setPage(1);
            }}
            options={[
              { value: 'all', label: t('allStatuses') },
              ...ALL_STATUSES.map((status) => ({ value: status, label: t(`status.${status}`) })),
            ]}
          />
        </div>
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
          {/* Mobile: one card per appointment. The table below needs 720px to
              show date, status and actions, so on a phone those columns sat
              off-screen behind a horizontal scroll. */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {data.map((apt) => (
              <div
                key={apt.id}
                className="space-y-3 rounded-xl border border-border bg-surface-card p-4 shadow-subtle"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="truncate font-semibold text-text-main">
                      {fullName(apt.patientFirstName, apt.patientLastName) || '—'}
                    </h4>
                    <p className="truncate text-xs text-text-muted">
                      {fullName(apt.doctorFirstName, apt.doctorLastName) || '—'}
                    </p>
                  </div>
                  <Badge variant={statusBadgeVariant[apt.status]} className="shrink-0">
                    {t(`status.${apt.status}`)}
                  </Badge>
                </div>

                {apt.subject && (
                  <p className="break-words text-xs text-text-muted">{apt.subject}</p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-y border-border py-2.5 text-xs text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-text-dimmed" />
                    {formatDate(apt.date, locale)}
                  </span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap tabular-nums">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-text-dimmed" />
                    {apt.startTime} – {apt.endTime}
                  </span>
                </div>

                {apt.status === 'REJECTED' && apt.rejectionReason && (
                  <p className="break-words text-xs text-text-dimmed">{apt.rejectionReason}</p>
                )}
                {apt.status === 'CANCELLED' && apt.cancellationReason && (
                  <p className="break-words text-xs text-text-dimmed">{apt.cancellationReason}</p>
                )}

                {(apt.status === 'BOOKED' || apt.status === 'APPROVED') && (
                  <div className="flex flex-wrap items-center gap-2">
                    {apt.status === 'BOOKED' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          disabled={pendingIds.has(apt.id)}
                          onClick={() => runAction(apt.id, approveAppointment)}
                        >
                          <Check className="h-4 w-4" />
                          {t('actions.approve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          disabled={pendingIds.has(apt.id)}
                          onClick={() => openReject(apt)}
                        >
                          <X className="h-4 w-4" />
                          {t('actions.reject')}
                        </Button>
                      </>
                    )}
                    {apt.status === 'APPROVED' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          disabled={pendingIds.has(apt.id)}
                          onClick={() => runAction(apt.id, completeAppointment)}
                        >
                          <Check className="h-4 w-4" />
                          {t('actions.complete')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          disabled={pendingIds.has(apt.id)}
                          onClick={() => runAction(apt.id, markAppointmentNotShown)}
                        >
                          <UserX className="h-4 w-4" />
                          {t('actions.notShow')}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-border bg-surface-card shadow-subtle md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-bg font-medium text-text-muted">
                    <th className="px-4 py-3.5 xl:px-6">{t('table.patient')}</th>
                    <th className="px-4 py-3.5 xl:px-6">{t('table.doctorService')}</th>
                    <th className="px-4 py-3.5 xl:px-6">{t('table.dateTime')}</th>
                    <th className="px-4 py-3.5 xl:px-6">{t('table.status')}</th>
                    <th className="px-4 py-3.5 text-right xl:px-6">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((apt) => (
                    <tr key={apt.id} className="transition-colors hover:bg-surface-bg/50">
                      <td className="px-4 py-4 xl:px-6">
                        <div className="font-medium text-text-main">
                          {fullName(apt.patientFirstName, apt.patientLastName) || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-4 xl:px-6">
                        <div className="font-medium text-text-main">
                          {fullName(apt.doctorFirstName, apt.doctorLastName) || '—'}
                        </div>
                        {apt.subject && <div className="text-xs text-text-muted">{apt.subject}</div>}
                      </td>
                      <td className="px-4 py-4 xl:px-6">
                        <div className="flex items-center gap-1.5 whitespace-nowrap text-text-main">
                          <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-text-dimmed" />
                          <span>{formatDate(apt.date, locale)}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap tabular-nums text-xs text-text-muted">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-text-dimmed" />
                          <span>
                            {apt.startTime} – {apt.endTime}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 xl:px-6">
                        <Badge variant={statusBadgeVariant[apt.status]}>
                          {t(`status.${apt.status}`)}
                        </Badge>
                        {apt.status === 'REJECTED' && apt.rejectionReason && (
                          <p className="mt-1 max-w-[220px] text-xs text-text-dimmed">
                            {apt.rejectionReason}
                          </p>
                        )}
                        {apt.status === 'CANCELLED' && apt.cancellationReason && (
                          <p className="mt-1 max-w-[220px] text-xs text-text-dimmed">
                            {apt.cancellationReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right xl:px-6">
                        <div className="flex items-center justify-end gap-1">
                          {apt.status === 'BOOKED' && (
                            <>
                              <button
                                type="button"
                                title={t('actions.approve')}
                                disabled={pendingIds.has(apt.id)}
                                onClick={() => runAction(apt.id, approveAppointment)}
                                className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-status-completed-fg disabled:opacity-40"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                title={t('actions.reject')}
                                disabled={pendingIds.has(apt.id)}
                                onClick={() => openReject(apt)}
                                className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-status-rejected-fg disabled:opacity-40"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {apt.status === 'APPROVED' && (
                            <>
                              <button
                                type="button"
                                title={t('actions.complete')}
                                disabled={pendingIds.has(apt.id)}
                                onClick={() => runAction(apt.id, completeAppointment)}
                                className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-status-completed-fg disabled:opacity-40"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                title={t('actions.notShow')}
                                disabled={pendingIds.has(apt.id)}
                                onClick={() => runAction(apt.id, markAppointmentNotShown)}
                                className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-status-rejected-fg disabled:opacity-40"
                              >
                                <UserX className="h-4 w-4" />
                              </button>
                            </>
                          )}
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
                  ‹
                </button>
                <button
                  type="button"
                  disabled={!meta.hasNextPage}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:bg-surface-bg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={modalOpen} onClose={closeModal} title={t('newAppointment')}>
        <AppointmentForm
          doctors={doctors}
          patients={patients}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          submitting={submitting}
          errorMessage={formError}
        />
      </Modal>

      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => (!rejecting ? setRejectTarget(null) : undefined)}
        title={t('rejectModal.title')}
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectTarget(null)} disabled={rejecting}>
              {tCommon('cancel')}
            </Button>
            <Button variant="danger" onClick={confirmReject} isLoading={rejecting}>
              {t('actions.reject')}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-text-muted">{t('rejectModal.message')}</p>
          <Textarea
            label={t('rejectModal.reason')}
            rows={3}
            maxLength={500}
            placeholder={t('rejectModal.reasonPlaceholder')}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
