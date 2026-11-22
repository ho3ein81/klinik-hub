'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Plus, Mail, Phone, Edit2, Trash2, Power, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { UserForm, type UserFormValues } from '@/components/forms';
import { useApiList } from '@/hooks/useApiList';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import {
  activateClinicUser,
  createClinicUser,
  deactivateClinicUser,
  deleteClinicUser,
  listClinicUsers,
  listSpecialties,
  updateClinicUser,
} from '@/services';
import { ApiError } from '@/lib/api-client';
import { clearAuthSession, getCurrentUser } from '@/lib/auth';
import type { ClinicUser, ClinicUserType, Specialty } from '@/types/domain';

const roleLabelKey: Record<ClinicUserType, string> = {
  DOCTOR: 'form.roles.doctor',
  NURSE: 'form.roles.nurse',
  RECEPTIONIST: 'form.roles.receptionist',
  ADMIN: 'form.roles.admin',
};

export default function UsersPage() {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const currentUser = getCurrentUser();

  const { page, limit, setPage } = usePagination(1, 10);
  const { data, meta, loading, error, refetch } = useApiList<ClinicUser>({
    fetcher: listClinicUsers,
    page,
    limit,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 250);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ClinicUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ClinicUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  useEffect(() => {
    listSpecialties({ page: 1, limit: 100, isActive: true })
      .then((res) => setSpecialties(res.data))
      .catch(() => setSpecialties([]));
  }, []);

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return data;
    return data.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      return (
        fullName.includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.phone ?? '').toLowerCase().includes(term)
      );
    });
  }, [data, debouncedSearch]);

  const openCreate = () => {
    setEditingUser(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (user: ClinicUser) => {
    setEditingUser(user);
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const handleSubmit = async (
    values: UserFormValues,
    avatarFile: File | null,
    avatarDelete: boolean
  ) => {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editingUser) {
        await updateClinicUser(
          editingUser.id,
          {
            email: values.email,
            firstName: values.firstName,
            lastName: values.lastName,
            phone: values.phone,
            type: values.type,
            specialtyIds: values.specialtyIds,
          },
          avatarFile,
          avatarDelete
        );
      } else {
        await createClinicUser(
          {
            email: values.email,
            firstName: values.firstName,
            lastName: values.lastName,
            phone: values.phone,
            password: values.password,
            type: values.type,
            specialtyIds: values.specialtyIds,
          },
          avatarFile
        );
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : tCommon('genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (user: ClinicUser) => {
    setPendingIds((prev) => new Set(prev).add(user.id));
    try {
      if (user.isActive) {
        await deactivateClinicUser(user.id);
        if (currentUser?.id === user.id) {
          clearAuthSession();
          router.replace(`/${locale}/auth` as Route);
          return;
        }
      } else {
        await activateClinicUser(user.id);
      }
      refetch();
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteClinicUser(deleteTarget.id);
      setDeleteTarget(null);
      refetch();
    } finally {
      setDeleting(false);
    }
  };

  if (currentUser && currentUser.type !== 'ADMIN') {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} description={t('description')} />
        <EmptyState message={t('adminOnly')} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          <span>{t('addUser')}</span>
        </Button>
      </PageHeader>

      <div className="rounded-xl border border-border bg-surface-card p-4 shadow-subtle">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
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
            {filtered.map((user) => (
              <div
                key={user.id}
                className="space-y-3 rounded-xl border border-border bg-surface-card p-4 shadow-subtle"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar firstName={user.firstName} lastName={user.lastName} avatar={user.avatar} />
                    <div className="min-w-0">
                      <h4 className="truncate font-semibold text-text-main">
                        {user.firstName} {user.lastName}
                      </h4>
                      <span className="text-xs text-text-dimmed">{t(roleLabelKey[user.type])}</span>
                    </div>
                  </div>
                  <Badge variant={user.isActive ? 'success' : 'neutral'}>
                    {user.isActive ? t('status.active') : t('status.inactive')}
                  </Badge>
                </div>
                <div className="space-y-1 border-y border-border py-2.5 text-xs text-text-muted">
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-text-dimmed" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-text-dimmed" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-end gap-1">
                  <RowActions
                    user={user}
                    pending={pendingIds.has(user.id)}
                    onEdit={() => openEdit(user)}
                    onToggle={() => toggleActive(user)}
                    onDelete={() => setDeleteTarget(user)}
                    labels={t}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-border bg-surface-card shadow-subtle md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-bg font-medium text-text-muted">
                    <th className="px-4 py-3.5 xl:px-6">{t('table.name')}</th>
                    <th className="px-4 py-3.5 xl:px-6">{t('table.contact')}</th>
                    <th className="px-4 py-3.5 xl:px-6">{t('table.role')}</th>
                    <th className="px-4 py-3.5 xl:px-6">{t('table.status')}</th>
                    <th className="px-4 py-3.5 text-right xl:px-6">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((user) => (
                    <tr key={user.id} className="transition-colors hover:bg-surface-bg/50">
                      <td className="px-4 py-4 xl:px-6">
                        <div className="flex items-center gap-3">
                          <Avatar firstName={user.firstName} lastName={user.lastName} avatar={user.avatar} />
                          <span className="font-medium text-text-main">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-text-muted xl:px-6">
                        <div className="[overflow-wrap:anywhere]">{user.email}</div>
                        {user.phone && <div className="text-xs text-text-dimmed">{user.phone}</div>}
                      </td>
                      <td className="px-4 py-4 text-text-muted xl:px-6">{t(roleLabelKey[user.type])}</td>
                      <td className="px-4 py-4 xl:px-6">
                        <Badge variant={user.isActive ? 'success' : 'neutral'}>
                          {user.isActive ? t('status.active') : t('status.inactive')}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 xl:px-6">
                        <div className="flex items-center justify-end gap-1">
                          <RowActions
                            user={user}
                            pending={pendingIds.has(user.id)}
                            onEdit={() => openEdit(user)}
                            onToggle={() => toggleActive(user)}
                            onDelete={() => setDeleteTarget(user)}
                            labels={t}
                          />
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
        title={editingUser ? t('editUser') : t('addUser')}
      >
        <UserForm
          initialUser={editingUser}
          specialties={specialties}
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

function RowActions({
  user,
  pending,
  onEdit,
  onToggle,
  onDelete,
  labels,
}: {
  user: ClinicUser;
  pending: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  labels: ReturnType<typeof useTranslations>;
}) {
  return (
    <>
      <button
        type="button"
        title={labels('actions.edit')}
        onClick={onEdit}
        className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-text-main"
      >
        <Edit2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        title={user.isActive ? labels('actions.deactivate') : labels('actions.activate')}
        onClick={onToggle}
        disabled={pending}
        className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-text-main disabled:opacity-40"
      >
        <Power className="h-4 w-4" />
      </button>
      <button
        type="button"
        title={labels('actions.delete')}
        onClick={onDelete}
        className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-status-rejected-fg"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </>
  );
}
