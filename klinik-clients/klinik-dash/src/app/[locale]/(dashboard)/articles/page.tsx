'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Archive, ChevronLeft, ChevronRight, Edit2, ImageIcon, Plus, Send, Trash2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { ProtectedImage } from '@/components/ui/ProtectedImage';
import EmptyState from '@/components/ui/EmptyState';
import { ArticleForm, type ArticleFormValues } from '@/components/forms';
import { useApiList } from '@/hooks/useApiList';
import { usePagination } from '@/hooks/usePagination';
import { useDebounce } from '@/hooks/useDebounce';
import {
  archiveArticle,
  articleImageUrl,
  createArticle,
  deleteArticle,
  listArticles,
  publishArticle,
  updateArticle,
} from '@/services';
import { ApiError } from '@/lib/api-client';
import { getCurrentUser } from '@/lib/auth';
import { stripHtml } from '@/lib/utils';
import type { Article, ArticleStatus } from '@/types/domain';

const ALL_STATUSES: ArticleStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

const statusVariant: Record<ArticleStatus, 'success' | 'neutral' | 'warning'> = {
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  ARCHIVED: 'warning',
};

export default function ArticlesPage() {
  const t = useTranslations('articles');
  const tCommon = useTranslations('common');

  const isAdmin = getCurrentUser()?.type === 'ADMIN';

  const { page, limit, setPage } = usePagination(1, 10);
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data, meta, loading, error, refetch } = useApiList<Article>({
    fetcher: (params) =>
      listArticles({ ...params, status: statusFilter === 'all' ? undefined : statusFilter }),
    page,
    limit,
    deps: [statusFilter],
  });

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return data;
    return data.filter(
      (article) =>
        article.title.toLowerCase().includes(term) ||
        stripHtml(article.content).toLowerCase().includes(term)
    );
  }, [data, debouncedSearch]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const openCreate = () => {
    setEditingArticle(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (article: Article) => {
    setEditingArticle(article);
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const handleSubmit = async (values: ArticleFormValues, imageFile: File | null) => {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editingArticle) {
        await updateArticle(editingArticle.id, values, imageFile);
      } else {
        await createArticle(values, imageFile);
      }
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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteArticle(deleteTarget.id);
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
          <span>{t('addArticle')}</span>
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
          className="max-w-md flex-1"
        />
        <div className="sm:w-56">
          <Select
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v as ArticleStatus | 'all');
              setPage(1);
            }}
            options={[
              { value: 'all', label: tCommon('all') },
              ...ALL_STATUSES.map((status) => ({ value: status, label: t(`status.${status}`) })),
            ]}
          />
        </div>
      </div>

      {isAdmin === false && (
        <p className="text-xs text-text-dimmed">{t('adminNote')}</p>
      )}

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
            {filtered.map((article) => (
              <div
                key={article.id}
                className="space-y-3 rounded-xl border border-border bg-surface-card p-4 shadow-subtle"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-bg">
                      {article.image ? (
                        <ProtectedImage
                          url={articleImageUrl(article.image, 'm')}
                          alt={article.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-text-dimmed">
                          <ImageIcon className="h-4 w-4 stroke-1" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate font-semibold text-text-main">{article.title}</h4>
                      <span className="line-clamp-1 text-xs text-text-dimmed">
                        {stripHtml(article.content)}
                      </span>
                    </div>
                  </div>
                  <Badge variant={statusVariant[article.status]}>
                    {t(`status.${article.status}`)}
                  </Badge>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    title={t('actions.edit')}
                    onClick={() => openEdit(article)}
                    className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-text-main"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  {isAdmin && article.status !== 'PUBLISHED' && (
                    <button
                      type="button"
                      title={t('actions.publish')}
                      disabled={pendingIds.has(article.id)}
                      onClick={() => runAction(article.id, publishArticle)}
                      className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-status-completed-fg disabled:opacity-40"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                  {isAdmin && article.status !== 'ARCHIVED' && (
                    <button
                      type="button"
                      title={t('actions.archive')}
                      disabled={pendingIds.has(article.id)}
                      onClick={() => runAction(article.id, archiveArticle)}
                      className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-text-main disabled:opacity-40"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    title={t('actions.delete')}
                    onClick={() => setDeleteTarget(article)}
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
                    <th className="px-4 py-3.5 xl:px-6">{t('table.title')}</th>
                    <th className="px-4 py-3.5 xl:px-6">{t('table.status')}</th>
                    <th className="px-4 py-3.5 text-right xl:px-6">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((article) => (
                    <tr key={article.id} className="transition-colors hover:bg-surface-bg/50">
                      <td className="px-4 py-4 xl:px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-bg">
                            {article.image ? (
                              <ProtectedImage
                                url={articleImageUrl(article.image, 'm')}
                                alt={article.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-text-dimmed">
                                <ImageIcon className="h-4 w-4 stroke-1" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-text-main">{article.title}</div>
                            <div className="max-w-[220px] truncate text-xs text-text-dimmed xl:max-w-sm">
                              {stripHtml(article.content)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 xl:px-6">
                        <Badge variant={statusVariant[article.status]}>
                          {t(`status.${article.status}`)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 xl:px-6">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title={t('actions.edit')}
                            onClick={() => openEdit(article)}
                            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-text-main"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {isAdmin && article.status !== 'PUBLISHED' && (
                            <button
                              type="button"
                              title={t('actions.publish')}
                              disabled={pendingIds.has(article.id)}
                              onClick={() => runAction(article.id, publishArticle)}
                              className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-status-completed-fg disabled:opacity-40"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}
                          {isAdmin && article.status !== 'ARCHIVED' && (
                            <button
                              type="button"
                              title={t('actions.archive')}
                              disabled={pendingIds.has(article.id)}
                              onClick={() => runAction(article.id, archiveArticle)}
                              className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-bg hover:text-text-main disabled:opacity-40"
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            title={t('actions.delete')}
                            onClick={() => setDeleteTarget(article)}
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
        title={editingArticle ? t('editArticle') : t('addArticle')}
      >
        <ArticleForm
          initialArticle={editingArticle}
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
          {t('confirmDelete.message', { title: deleteTarget?.title ?? '' })}
        </p>
      </Modal>
    </div>
  );
}
