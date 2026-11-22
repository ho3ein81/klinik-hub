'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ApiError } from '@/lib/api-client'
import {
  getMonthlyAppointmentStatistics,
  recentMonthRanges,
} from '@/services/appointments.service'
import type { MonthlyStatusDatum } from '@/components/charts/AppointmentStatusChart'

interface UseAppointmentStatusHistoryResult {
  data: MonthlyStatusDatum[]
  loading: boolean
  error: string | null
}

/**
 * Appointment counts per status for the current calendar month and the
 * `monthCount - 1` months before it.
 *
 * Deliberately independent of the dashboard's date-range picker: the window is
 * computed once (the `useMemo` depends only on `monthCount`) and the effect
 * depends on that object, so moving the picker cannot refetch these requests
 * or shift the chart's x-axis.
 */
export function useAppointmentStatusHistory(
  monthCount = 4,
): UseAppointmentStatusHistoryResult {
  const tCommon = useTranslations('common')
  const [data, setData] = useState<MonthlyStatusDatum[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const months = useMemo(() => recentMonthRanges(monthCount), [monthCount])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getMonthlyAppointmentStatistics(months)
      .then((rows) => {
        if (cancelled) return
        setData(
          rows.map(({ monthStart, counts }) => ({
            monthStart,
            booked: counts.booked,
            completed: counts.completed,
            cancelled: counts.cancelled,
            notShow: counts.notShow,
            total: counts.total,
          })),
        )
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : tCommon('genericError'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [months, tCommon])

  return { data, loading, error }
}
