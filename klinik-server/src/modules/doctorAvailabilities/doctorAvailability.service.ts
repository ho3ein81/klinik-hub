import { ClinicUserType, DayOfWeek } from '@prisma/client'
import { PaginationParams } from '../../types/pagination'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  OverlappingValueError,
} from '../../utils/errors'
import {
  buildPaginationMeta,
  getPaginationParams,
  PaginationMeta,
} from '../../utils/pagination'
import { withScope } from '../../utils/scope'
import prisma from '../../db/prisma'
import {
  CreateDoctorAvailabilityRequestDto,
  DoctorAvailabilityResponseDto,
  DoctorSlotResponseDto,
  UpdateDoctorAvailabilityRequestDto,
} from './doctorAvailability.dto'
import { toDoctorAvailabilityResponseDto } from './doctorAvailability.mapper'
import {
  doctorAvailabilityRepository,
  FullDoctorAvailability,
} from './doctorAvailability.repository'
import {
  getDayOfWeek,
  minutesToTime,
  timeToMinutes,
} from '../../utils/dateHelper'
import { clinicUserRepository } from '../clinicUsers/clinicUser.repository'
import { getExistingAppointments } from '../appointments/appointment.service'
import { getDoctorBlockedTimesOverlappingDay } from '../doctorBlockedTimes/doctorBlockedTime.service'

interface GetDoctorAvailabilitiesParams extends PaginationParams {
  clinicId?: string
  doctorId?: string
  dayOfWeek?: DayOfWeek
  isActive?: boolean
  authenticatedClinicId?: string
  callerType?: ClinicUserType
  callerId?: string
}

function ensureOwnership(
  doctorId: string,
  callerType?: ClinicUserType,
  callerId?: string,
): void {
  if (callerType === ClinicUserType.DOCTOR && doctorId !== callerId) {
    throw new ForbiddenError('doctorAvailability.notOwner')
  }
}

async function ensureDoctorBelongsToClinic(
  doctorId: string,
  clinicId: string,
): Promise<void> {
  const doctor = await clinicUserRepository.findOne({
    id: doctorId,
    clinicId,
  })

  if (!doctor) {
    throw new NotFoundError('Doctor not found in this clinic')
  }

  if (doctor.type !== ClinicUserType.DOCTOR) {
    throw new BadRequestError('doctorAvailability.doctorTypeRequired')
  }
}

async function ensureNoOverlap(params: {
  clinicId: string
  doctorId: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  excludeId?: string
  isActive?: boolean
}): Promise<void> {
  // Inactive availabilities do not block an active availability.
  if (params.isActive === false) return

  const overlapping = await doctorAvailabilityRepository.findOverlapping(params)

  if (overlapping) {
    throw new OverlappingValueError(
      'Overlapping doctor availability exists for the given time range',
    )
  }
}

export async function getDoctorAvailabilities(
  params: GetDoctorAvailabilitiesParams,
): Promise<{
  data: DoctorAvailabilityResponseDto[]
  meta: PaginationMeta
}> {
  const { skip, take, page, limit } = getPaginationParams(params as any)

  // A DOCTOR can only ever see their own availabilities, regardless of
  // what doctorId filter was requested.
  const doctorId =
    params.callerType === ClinicUserType.DOCTOR
      ? params.callerId
      : params.doctorId

  const where = withScope(
    {
      ...(params.clinicId && { clinicId: params.clinicId }),
      ...(doctorId && { doctorId }),
      ...(params.dayOfWeek && { dayOfWeek: params.dayOfWeek }),
      ...(params.isActive !== undefined && { isActive: params.isActive }),
    },
    params.authenticatedClinicId,
  )

  const { data, total } =
    await doctorAvailabilityRepository.findAll<FullDoctorAvailability>({
      where,
      orderBy: params.sortBy
        ? { [params.sortBy]: params.sortOrder ?? 'asc' }
        : { createdAt: params.sortOrder ?? 'desc' },
      skip,
      take,
      include: { doctor: true },
    })

  return {
    data: data.map(toDoctorAvailabilityResponseDto),
    meta: buildPaginationMeta(page, limit, total),
  }
}

export async function createDoctorAvailability(
  data: CreateDoctorAvailabilityRequestDto,
  authenticatedClinicId?: string,
  callerType?: ClinicUserType,
  callerId?: string,
): Promise<DoctorAvailabilityResponseDto> {
  const clinicId = authenticatedClinicId || data.clinicId

  if (!clinicId) {
    throw new NotFoundError('Clinic not found')
  }

  ensureOwnership(data.doctorId, callerType, callerId)

  await ensureDoctorBelongsToClinic(data.doctorId, clinicId)

  await ensureNoOverlap({
    clinicId,
    doctorId: data.doctorId,
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
    endTime: data.endTime,
  })

  const availability = await doctorAvailabilityRepository.create({
    clinicId,
    doctorId: data.doctorId,
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
    endTime: data.endTime,
    ...(data.durationSlot !== undefined && { durationSlot: data.durationSlot }),
  })

  const created =
    await doctorAvailabilityRepository.findById<FullDoctorAvailability>(
      availability.id,
      { include: { doctor: true } },
    )

  return toDoctorAvailabilityResponseDto(created ?? availability)
}

export async function getDoctorAvailabilityById(
  id: string,
  authenticatedClinicId?: string,
  callerType?: ClinicUserType,
  callerId?: string,
): Promise<DoctorAvailabilityResponseDto> {
  const where = withScope({ id }, authenticatedClinicId)

  const availability =
    await doctorAvailabilityRepository.findFirst<FullDoctorAvailability>(
      where,
      { include: { doctor: true } },
    )

  if (!availability) {
    throw new NotFoundError('Doctor availability not found')
  }

  ensureOwnership(availability.doctorId, callerType, callerId)

  return toDoctorAvailabilityResponseDto(availability)
}

export async function updateDoctorAvailability(
  id: string,
  data: UpdateDoctorAvailabilityRequestDto,
  authenticatedClinicId?: string,
  callerType?: ClinicUserType,
  callerId?: string,
): Promise<DoctorAvailabilityResponseDto> {
  const where = withScope({ id }, authenticatedClinicId)
  const existing = await doctorAvailabilityRepository.findFirst(where)

  if (!existing) {
    throw new NotFoundError('Doctor availability not found')
  }

  ensureOwnership(existing.doctorId, callerType, callerId)

  const clinicId = existing.clinicId
  const dayOfWeek = data.dayOfWeek ?? existing.dayOfWeek
  const startTime = data.startTime ?? existing.startTime
  const endTime = data.endTime ?? existing.endTime

  await ensureNoOverlap({
    clinicId,
    doctorId: existing.doctorId,
    dayOfWeek,
    startTime,
    endTime,
    excludeId: existing.id,
    isActive: existing.isActive,
  })

  await doctorAvailabilityRepository.updateOne(where, data)

  const updated =
    await doctorAvailabilityRepository.findFirst<FullDoctorAvailability>(
      where,
      { include: { doctor: true } },
    )

  return toDoctorAvailabilityResponseDto(updated!)
}

export async function deleteDoctorAvailability(
  id: string,
  authenticatedClinicId?: string,
  callerType?: ClinicUserType,
  callerId?: string,
): Promise<void> {
  const where = withScope({ id }, authenticatedClinicId)
  const existing = await doctorAvailabilityRepository.findFirst(where)

  if (!existing) {
    throw new NotFoundError('Doctor availability not found')
  }

  ensureOwnership(existing.doctorId, callerType, callerId)

  await doctorAvailabilityRepository.deleteOne(where)
}

export async function activateDoctorAvailability(
  id: string,
  authenticatedClinicId?: string,
  callerType?: ClinicUserType,
  callerId?: string,
): Promise<DoctorAvailabilityResponseDto> {
  const where = withScope({ id }, authenticatedClinicId)
  const existing = await doctorAvailabilityRepository.findFirst(where)

  if (!existing) {
    throw new NotFoundError('Doctor availability not found')
  }

  ensureOwnership(existing.doctorId, callerType, callerId)

  const availability = await doctorAvailabilityRepository.updateOne(where, {
    isActive: true,
  })

  return toDoctorAvailabilityResponseDto(availability)
}

export async function deactivateDoctorAvailability(
  id: string,
  authenticatedClinicId?: string,
  callerType?: ClinicUserType,
  callerId?: string,
): Promise<DoctorAvailabilityResponseDto> {
  const where = withScope({ id }, authenticatedClinicId)
  const existing = await doctorAvailabilityRepository.findFirst(where)

  if (!existing) {
    throw new NotFoundError('Doctor availability not found')
  }

  ensureOwnership(existing.doctorId, callerType, callerId)

  const availability = await doctorAvailabilityRepository.updateOne(where, {
    isActive: false,
  })

  return toDoctorAvailabilityResponseDto(availability)
}

/** Public, read-only weekly schedule for a doctor — used by the patient portal. */
export async function getPublicDoctorAvailabilities(
  doctorId: string,
): Promise<DoctorAvailabilityResponseDto[]> {
  const { data } =
    await doctorAvailabilityRepository.findAll<FullDoctorAvailability>({
      where: { doctorId, isActive: true },
      orderBy: { dayOfWeek: 'asc' },
      include: { doctor: true },
    })

  return data.map(toDoctorAvailabilityResponseDto)
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export async function getDoctorAvailabilitySlotsForDate(
  doctorId: string,
  date: Date,
): Promise<DoctorSlotResponseDto[]> {
  const clinicUser = await clinicUserRepository.findById(doctorId)

  if (!clinicUser) {
    throw new NotFoundError('Clinic user not found')
  }

  const dayOfWeek = getDayOfWeek(date)

  // 1. Fetch doctor's active availabilities for the target day of the week
  const { data: availabilities } = await doctorAvailabilityRepository.findAll({
    where: {
      doctorId,
      dayOfWeek: dayOfWeek,
      isActive: true,
    },
  })

  if (!availabilities.length) {
    return []
  }

  const existingAppointments = await getExistingAppointments({
    doctorId,
    date,
  })

  const blockedRanges = await getDoctorBlockedTimesOverlappingDay(
    doctorId,
    date,
  )

  const now = new Date()
  const isToday = isSameCalendarDay(date, now)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  const availableSlots: DoctorSlotResponseDto[] = []

  // 3. Generate slots and filter out booked slots
  for (const availability of availabilities) {
    const slotDuration = availability.durationSlot || 30 // Fallback to 30 mins if null
    const windowStart = timeToMinutes(availability.startTime)
    const windowEnd = timeToMinutes(availability.endTime)

    let currentStart = windowStart
    while (currentStart + slotDuration <= windowEnd) {
      const currentEnd = currentStart + slotDuration

      // For today, skip slots that have already started or already ended.
      if (isToday && (currentStart < nowMinutes || currentEnd <= nowMinutes)) {
        currentStart += slotDuration
        continue
      }

      const slotStartStr = minutesToTime(currentStart)
      const slotEndStr = minutesToTime(currentEnd)

      // Check if slot overlaps with any existing appointment
      const isBooked = existingAppointments.some((apt) => {
        return slotStartStr < apt.endTime && slotEndStr > apt.startTime
      })

      const slotStartInstant = new Date(
        Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          Math.floor(currentStart / 60),
          currentStart % 60,
        ),
      )
      const slotEndInstant = new Date(
        Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          Math.floor(currentEnd / 60),
          currentEnd % 60,
        ),
      )
      const isBlocked = blockedRanges.some(
        (range) =>
          slotStartInstant < range.endDate && slotEndInstant > range.startDate,
      )

      if (!isBooked && !isBlocked) {
        availableSlots.push({
          date: date,
          startTime: slotStartStr,
          endTime: slotEndStr,
          doctorId,
        })
      }

      currentStart += slotDuration
    }
  }

  return availableSlots
}

export async function getFirstDoctorAvailabilitySlot(
  doctorId: string,
  fromDate: Date = new Date(),
): Promise<DoctorSlotResponseDto | null> {
  const searchLimitDays = 30
  const currentDate = new Date(fromDate)

  for (let i = 0; i < searchLimitDays; i++) {
    const slots = await getDoctorAvailabilitySlotsForDate(doctorId, currentDate)
    if (slots.length > 0) {
      return slots[0]
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return null
}
