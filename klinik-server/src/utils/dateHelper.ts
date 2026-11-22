import { DayOfWeek } from '@prisma/client'

const DAY_OF_WEEK_BY_INDEX: DayOfWeek[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
] as DayOfWeek[]

export function getDayOfWeek(date: Date): DayOfWeek {
  return DAY_OF_WEEK_BY_INDEX[date.getUTCDay()]
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function computeDurationMinutes(
  startTime: string,
  endTime: string,
): number {
  return timeToMinutes(endTime) - timeToMinutes(startTime)
}

export function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setUTCHours(0, 0, 0, 0)
  return result
}

export function endOfDay(date: Date): Date {
  const result = new Date(date)
  result.setUTCHours(23, 59, 59, 999)
  return result
}

export function timeRangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return (
    timeToMinutes(aStart) < timeToMinutes(bEnd) &&
    timeToMinutes(bStart) < timeToMinutes(aEnd)
  )
}
