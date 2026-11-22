import { AppointmentStatus, ClinicUserType } from '@prisma/client'
import { PaginationParams } from '../../types/pagination'
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../utils/errors'
import {
  buildPaginationMeta,
  getPaginationParams,
  PaginationMeta,
} from '../../utils/pagination'
import { withScope } from '../../utils/scope'
import {
  CreateDoctorBlockedTimeRequestDto,
  DoctorBlockedTimeResponseDto,
} from './doctorBlockedTime.dto'
import { toDoctorBlockedTimeResponseDto } from './doctorBlockedTime.mapper'
import {
  doctorBlockedTimeRepository,
  FullDoctorBlockedTime,
} from './doctorBlockedTime.repository'
import { clinicUserRepository } from '../clinicUsers/clinicUser.repository'
import { appointmentRepository } from '../appointments/appointment.repository'
import { endOfDay, startOfDay } from '../../utils/dateHelper'

interface GetDoctorBlockedTimesParams extends PaginationParams {
  clinicId?: string
  doctorId?: string
  from?: Date
  to?: Date
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
    throw new ForbiddenError('doctorBlockedTime.notOwner')
  }
}

// An appointment in one of these statuses still needs the doctor's
// attention — a blocked time cannot silently swallow it.
const APPOINTMENT_BLOCKING_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.BOOKED,
  AppointmentStatus.APPROVED,
]

function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      hours,
      minutes,
    ),
  )
}

async function assertNoConflictingAppointments(
  doctorId: string,
  startDate: Date,
  endDate: Date,
): Promise<void> {
  // `date` only stores the calendar day (UTC midnight), so widen the DB
  // filter to every day the block could touch, then re-check precisely
  // below using each appointment's real start/end instant.
  const { data: candidates } = await appointmentRepository.findAll({
    where: {
      doctorId,
      status: { in: APPOINTMENT_BLOCKING_STATUSES },
      date: { gte: startOfDay(startDate), lte: endOfDay(endDate) },
    },
  })
  const hasConflict = candidates.some((appointment) => {
    const apptStart = combineDateAndTime(
      appointment.date,
      appointment.startTime,
    )
    const apptEnd = combineDateAndTime(appointment.date, appointment.endTime)
    return apptStart < endDate && apptEnd > startDate
  })

  if (hasConflict) {
    throw new ConflictError('doctorBlockedTime.hasAppointmentConflict')
  }
}

export async function getDoctorBlockedTimes(
  params: GetDoctorBlockedTimesParams,
): Promise<{ data: DoctorBlockedTimeResponseDto[]; meta: PaginationMeta }> {
  const { skip, take, page, limit } = getPaginationParams(params as any)

  const doctorId =
    params.callerType === ClinicUserType.DOCTOR
      ? params.callerId
      : params.doctorId

  const where = withScope(
    {
      ...(params.clinicId && { clinicId: params.clinicId }),
      ...(doctorId && { doctorId }),
      ...(params.from && { endDate: { gt: params.from } }),
      ...(params.to && { startDate: { lt: params.to } }),
    },
    params.authenticatedClinicId,
  )

  const { data, total } =
    await doctorBlockedTimeRepository.findAll<FullDoctorBlockedTime>({
      where,
      orderBy: { startDate: params.sortOrder ?? 'asc' },
      skip,
      take,
      include: { doctor: true },
    })

  return {
    data: data.map(toDoctorBlockedTimeResponseDto),
    meta: buildPaginationMeta(page, limit, total),
  }
}

export async function createDoctorBlockedTime(
  data: CreateDoctorBlockedTimeRequestDto,
  authenticatedClinicId?: string,
  callerType?: ClinicUserType,
  callerId?: string,
): Promise<DoctorBlockedTimeResponseDto> {
  const clinicId = authenticatedClinicId || data.clinicId

  if (!clinicId) {
    throw new NotFoundError('Clinic not found')
  }

  ensureOwnership(data.doctorId, callerType, callerId)

  const doctor = await clinicUserRepository.findFirst({
    id: data.doctorId,
    clinicId,
  })

  if (!doctor) {
    throw new NotFoundError('Doctor not found in this clinic')
  }

  if (doctor.type !== ClinicUserType.DOCTOR) {
    throw new ConflictError('doctorBlockedTime.doctorTypeRequired')
  }

  const startDate = new Date(data.startDate)
  const endDate = new Date(data.endDate)

  await assertNoConflictingAppointments(data.doctorId, startDate, endDate)

  const overlapping = await doctorBlockedTimeRepository.findOverlapping({
    doctorId: data.doctorId,
    startDate,
    endDate,
  })

  if (overlapping.length > 0) {
    throw new ConflictError('doctorBlockedTime.overlapping')
  }

  const blockedTime = await doctorBlockedTimeRepository.create({
    clinicId,
    doctorId: data.doctorId,
    startDate,
    endDate,
    reason: data.reason,
  })

  const created =
    await doctorBlockedTimeRepository.findById<FullDoctorBlockedTime>(
      blockedTime.id,
      { include: { doctor: true } },
    )

  return toDoctorBlockedTimeResponseDto(created ?? blockedTime)
}

export async function getDoctorBlockedTimeById(
  id: string,
  authenticatedClinicId?: string,
  callerType?: ClinicUserType,
  callerId?: string,
): Promise<DoctorBlockedTimeResponseDto> {
  const where = withScope({ id }, authenticatedClinicId)

  const blockedTime =
    await doctorBlockedTimeRepository.findFirst<FullDoctorBlockedTime>(where, {
      include: { doctor: true },
    })

  if (!blockedTime) {
    throw new NotFoundError('Doctor blocked time not found')
  }

  ensureOwnership(blockedTime.doctorId, callerType, callerId)

  return toDoctorBlockedTimeResponseDto(blockedTime)
}

export async function deleteDoctorBlockedTime(
  id: string,
  authenticatedClinicId?: string,
  callerType?: ClinicUserType,
  callerId?: string,
): Promise<void> {
  const where = withScope({ id }, authenticatedClinicId)
  const existing = await doctorBlockedTimeRepository.findFirst(where)

  if (!existing) {
    throw new NotFoundError('Doctor blocked time not found')
  }

  ensureOwnership(existing.doctorId, callerType, callerId)

  await doctorBlockedTimeRepository.deleteOne(where)
}

/**
 * Whether the doctor has any blocked-time row covering [startTime, endTime)
 * on the given date. Used by the booking flow to keep blocked periods from
 * ever being offered or booked as available slots.
 */
export async function isDoctorBlocked(
  doctorId: string,
  date: Date,
  startTime: string,
  endTime: string,
): Promise<boolean> {
  const slotStart = combineDateAndTime(date, startTime)
  const slotEnd = combineDateAndTime(date, endTime)

  const overlapping = await doctorBlockedTimeRepository.findOverlapping({
    doctorId,
    startDate: slotStart,
    endDate: slotEnd,
  })

  return overlapping.length > 0
}

/**
 * All of a doctor's blocked-time rows that touch the given calendar day —
 * fetched once so slot generation can filter a whole day's worth of slots
 * in memory instead of querying per candidate slot.
 */
export async function getDoctorBlockedTimesOverlappingDay(
  doctorId: string,
  date: Date,
): Promise<{ startDate: Date; endDate: Date }[]> {
  return doctorBlockedTimeRepository.findOverlapping({
    doctorId,
    startDate: startOfDay(date),
    endDate: endOfDay(date),
  })
}
