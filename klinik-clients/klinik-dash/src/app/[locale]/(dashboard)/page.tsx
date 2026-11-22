'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  UserX,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { DatePicker } from '@/components/ui/DatePicker';
import EmptyState from '@/components/ui/EmptyState';
import { getAppointmentStatistics, listAppointments } from '@/services';
import AppointmentStatusChart from '@/components/charts/AppointmentStatusChart';
import { useAppointmentStatusHistory } from '@/hooks/useAppointmentStatusHistory';
import { ApiError } from '@/lib/api-client';
import { cn, fullName } from '@/lib/utils';
import type { Appointment, AppointmentStatus, AppointmentStatusCounts } from '@/types/domain';

const statusBadgeVariant: Record<AppointmentStatus, 'success' | 'neutral' | 'danger' | 'warning' | 'primary'> = {
  BOOKED: 'warning',
  APPROVED: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
  REJECTED: 'danger',
  NOT_SHOW: 'danger',
};

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfCurrentMonth(): string {
  const now = new Date();
  return formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

function today(): string {
  return formatLocalDate(new Date());
}

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tStatus = useTranslations('dashboard.status');
  const tCommon = useTranslations('common');

  const [from, setFrom] = useState(startOfCurrentMonth());
  const [to, setTo] = useState(today());
  const [counts, setCounts] = useState<AppointmentStatusCounts | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Its own window (the last 4 calendar months) and its own loading flag, so
  // the date-range picker above never refetches or blanks the chart.
  const {
    data: history,
    loading: historyLoading,
    error: historyError,
  } = useAppointmentStatusHistory(4);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getAppointmentStatistics(from, to),
      listAppointments({ page: 1, limit: 100, date: today(), sortBy: 'startTime', sortOrder: 'asc' }),
    ])
      .then(([statsRes, todayRes]) => {
        if (cancelled) return;
        setCounts(statsRes);
        setTodaySchedule(todayRes.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : tCommon('genericError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [from, to, tCommon]);

  const cards: Array<{ key: keyof AppointmentStatusCounts; icon: typeof CalendarCheck }> = [
    { key: 'total', icon: CalendarCheck },
    { key: 'booked', icon: Clock },
    { key: 'approved', icon: CheckCircle2 },
    { key: 'completed', icon: CheckCircle2 },
    { key: 'cancelled', icon: XCircle },
    { key: 'rejected', icon: AlertCircle },
    { key: 'notShow', icon: UserX },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-main sm:text-2xl">{t('title')}</h1>
          <p className="mt-0.5 text-sm text-text-muted">{t('subtitle')}</p>
        </div>
        <div className="flex flex-col items-center gap-2 sm:flex-row">
          <div className="w-full sm:w-40">
            <DatePicker maxDate={to} value={from} onChange={setFrom} />
          </div>
          <span className="shrink-0 text-text-dimmed">–</span>
          <div className="w-full sm:w-40">
            <DatePicker minDate={from} maxDate={today()} value={to} onChange={setTo} />
          </div>
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

      {/* Spinner only on the very first load. Later refetches dim the body in
          place instead of unmounting it, so changing a date doesn't tear the
          chart down and make it remeasure from zero width. */}
      {loading && counts === null ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div
          aria-busy={loading}
          className={cn('space-y-6 transition-opacity duration-200', loading && 'opacity-60')}
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            {cards.map(({ key, icon: Icon }) => (
              <div
                key={key}
                className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-surface-card p-4 shadow-subtle"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium tracking-tight text-text-muted">
                    {t(`stats.${key}`)}
                  </span>
                  <div className="rounded-lg bg-primary-tint p-2 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <span className="text-2xl font-bold tracking-tight text-text-main">
                  {counts?.[key] ?? 0}
                </span>
              </div>
            ))}
          </div>

          <AppointmentStatusChart
            data={history}
            loading={historyLoading}
            error={historyError}
          />

          <div className="rounded-2xl border border-border bg-surface-card p-4 shadow-subtle sm:p-6">
            <h2 className="text-base font-bold text-text-main">{t('schedule.title')}</h2>

            {todaySchedule.length === 0 ? (
              <div className="py-8">
                <EmptyState message={t('schedule.empty')} />
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-semibold text-text-dimmed">
                      <th className="pb-3">{t('schedule.columns.time')}</th>
                      <th className="pb-3">{t('schedule.columns.patient')}</th>
                      <th className="pb-3">{t('schedule.columns.doctor')}</th>
                      <th className="pb-3">{t('schedule.columns.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {todaySchedule.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-bg/60">
                        <td className="py-3 font-medium text-text-muted">
                          {item.startTime} – {item.endTime}
                        </td>
                        <td className="py-3 font-semibold text-text-main">
                          {fullName(item.patientFirstName, item.patientLastName)}
                        </td>
                        <td className="py-3 text-text-main">
                          {fullName(item.doctorFirstName, item.doctorLastName)}
                        </td>
                        <td className="py-3">
                          <Badge variant={statusBadgeVariant[item.status]}>
                            {tStatus(item.status)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
