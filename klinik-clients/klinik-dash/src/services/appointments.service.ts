import { api } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api.config'
import { formatLocalDate } from '@/lib/utils'
import type { ApiPaginated, ApiSuccess, ListQuery } from '@/types/api'
import type {
  Appointment,
  AppointmentStatus,
  AppointmentStatusCounts,
} from '@/types/domain'

export interface AppointmentInput {
  patientId?: string
  firstName?: string
  lastName?: string
  phone?: string
  doctorId: string
  subject?: string
  description?: string
  date: string
  startTime: string
  endTime: string
}

export function listAppointments(
  params: ListQuery & {
    status?: AppointmentStatus
    doctorId?: string
    patientId?: string
    date?: string
    /** Matches the patient's first name, last name or phone. */
    search?: string
  },
) {
  return api.get<ApiPaginated<Appointment>>(API_ENDPOINTS.appointments.list, {
    params,
  })
}

export async function createAppointment(
  input: AppointmentInput,
): Promise<Appointment> {
  const res = await api.post<ApiSuccess<Appointment>>(
    API_ENDPOINTS.appointments.list,
    input,
  )
  return res.data
}

export async function approveAppointment(id: string): Promise<void> {
  await api.patch(API_ENDPOINTS.appointments.approve(id))
}

export async function completeAppointment(id: string): Promise<void> {
  await api.patch(API_ENDPOINTS.appointments.complete(id))
}

export async function rejectAppointment(id: string, reason?: string): Promise<void> {
  await api.patch(API_ENDPOINTS.appointments.reject(id), { reason })
}

export async function markAppointmentNotShown(id: string): Promise<void> {
  await api.patch(API_ENDPOINTS.appointments.notShow(id))
}

export async function getAppointmentStatistics(
  from: string,
  to: string,
): Promise<AppointmentStatusCounts> {
  const res = await api.get<ApiSuccess<AppointmentStatusCounts>>(
    API_ENDPOINTS.appointments.statistics,
    { params: { from, to } },
  )
  return res.data
}

export interface MonthRange {
  /** First day of the month, local time. */
  monthStart: Date
  /** yyyy-mm-dd, first day of the month. */
  from: string
  /** yyyy-mm-dd, last day of the month. */
  to: string
}

/**
 * The reference month and the `count - 1` months before it, oldest first.
 *
 * All arithmetic is local-time on purpose: `new Date(y, m, 1)` and
 * `new Date(y, m + 1, 0)` resolve month and year rollover themselves
 * (month -1 becomes December of the previous year), and `formatLocalDate`
 * reads back the same local fields — so no value can shift a day via UTC.
 *
 * The range ends on the real last day of the month rather than today, because
 * appointments booked later this month are genuine data. The consequence is
 * that the current month is always a month in progress.
 */
export function recentMonthRanges(
  count = 4,
  reference: Date = new Date(),
): MonthRange[] {
  const year = reference.getFullYear()
  const month = reference.getMonth()
  const ranges: MonthRange[] = []

  for (let offset = count - 1; offset >= 0; offset--) {
    const monthStart = new Date(year, month - offset, 1)
    const monthEnd = new Date(year, month - offset + 1, 0)
    ranges.push({
      monthStart,
      from: formatLocalDate(monthStart),
      to: formatLocalDate(monthEnd),
    })
  }

  return ranges
}

export interface MonthlyAppointmentStatistics extends MonthRange {
  counts: AppointmentStatusCounts
}

/**
 * One `getAppointmentStatistics` call per month, in parallel. The statistics
 * endpoint buckets a single date range, so splitting by month is a client
 * concern.
 */
export function getMonthlyAppointmentStatistics(
  months: MonthRange[],
): Promise<MonthlyAppointmentStatistics[]> {
  return Promise.all(
    months.map(async (range) => ({
      ...range,
      counts: await getAppointmentStatistics(range.from, range.to),
    })),
  )
}
