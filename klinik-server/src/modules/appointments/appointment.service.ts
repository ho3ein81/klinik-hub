import {
  Appointment,
  AppointmentCreatedByType,
  AppointmentStatus,
  Prisma,
} from '@prisma/client'
import { ConflictError, NotFoundError } from '../../utils/errors'
import { unitOfWork } from '../../db/unitOfWork'
import { withScope } from '../../utils/scope'
import {
  buildPaginationMeta,
  getPaginationParams,
  PaginationMeta,
} from '../../utils/pagination'
import { PaginationParams } from '../../types/pagination'
import { generateOtp, verifyOtp } from '../otp/otp.service'
import { patientRepository } from '../patients/patient.repository'
import { clinicRepository } from '../clinics/clinic.repository'

import {
  AppointmentResponseDto,
  AppointmentStatusCounts,
  AppointmentStatusCountsDto,
  BookAppointmentAnonymousRequestDto,
  BookAppointmentAsPatientRequestDto,
  CreateAppointmentByStaffRequestDto,
  GetAppointmentsParamsDto,
  GetExistingAppointmentsDto,
  RescheduleAppointmentRequestDto,
  TransitionAppointmentStatusDto,
} from './appointment.dto'
import { toAppointmentResponseDto } from './appointment.mapper'
import {
  appointmentRepository,
  FullAppointment,
} from './appointment.repository'
import { resolveOrCreatePatient } from '../patients/patient.service'
import {
  computeDurationMinutes,
  endOfDay,
  getDayOfWeek,
  startOfDay,
  timeRangesOverlap,
  timeToMinutes,
} from '../../utils/dateHelper'
import { doctorAvailabilityRepository } from '../doctorAvailabilities/doctorAvailability.repository'
import { isDoctorBlocked } from '../doctorBlockedTimes/doctorBlockedTime.service'
import { isPatientBookingAllowed } from '../clinicSettings/clinicSetting.service'
import {
  notifyAppointmentBooked,
  notifyAppointmentRejected,
} from '../notifications/notification.service'

export async function requestAppointmentOtp(phone: string): Promise<void> {
  await generateOtp(phone, 'PHONE_VERIFICATION')
}

async function assertPatientBookingAllowed(clinicId: string): Promise<void> {
  if (!(await isPatientBookingAllowed(clinicId))) {
    throw new ConflictError('appointment.patientBookingDisabled')
  }
}

export async function bookAppointmentAnonymous(
  dto: BookAppointmentAnonymousRequestDto,
): Promise<AppointmentResponseDto> {
  await assertPatientBookingAllowed(dto.clinicId)
  await verifyOtp(dto.phone, dto.code, 'PHONE_VERIFICATION')

  // The (possible) new-patient insert and the appointment insert must
  // commit or roll back together — otherwise a failed appointment create
  // could leave behind a patient record for no booking.
  const appointment = await unitOfWork(async (tx) => {
    const clinic = await clinicRepository.findById(dto.clinicId, undefined, tx)
    if (!clinic) {
      throw new NotFoundError('Clinic not found')
    }

    const date = new Date(dto.date)

    await assertDoctorAvailable({
      clinicId: dto.clinicId,
      doctorId: dto.doctorId,
      date,
      startTime: dto.startTime,
      endTime: dto.endTime,
    })

    const patient = await resolveOrCreatePatient(
      {
        clinicId: dto.clinicId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        dateOfBirth: dto.dateOfBirth,
      },
      undefined,
      tx,
    )

    return appointmentRepository.create(
      {
        clinicId: dto.clinicId,
        doctorId: dto.doctorId,
        patientId: patient.id,
        subject: dto.subject,
        description: dto.description,
        date,
        startTime: dto.startTime,
        endTime: dto.endTime,
        createdByType: AppointmentCreatedByType.PATIENT,
      },
      tx,
    )
  })

  const fullAppointment =
    await appointmentRepository.findFirst<FullAppointment>(
      { id: appointment.id },
      { include: { patient: true, doctor: true } },
    )

  if (fullAppointment) {
    void notifyAppointmentBooked({
      appointmentId: fullAppointment.id,
      clinicId: fullAppointment.clinicId,
      patientId: fullAppointment.patientId,
      patientPhone: fullAppointment.patient.phone,
      patientName: `${fullAppointment.patient.firstName} ${fullAppointment.patient.lastName}`,
      doctorId: fullAppointment.doctorId,
      doctorPhone: fullAppointment.doctor.phone,
      doctorName: `${fullAppointment.doctor.firstName} ${fullAppointment.doctor.lastName}`,
      date: fullAppointment.date,
      startTime: fullAppointment.startTime,
    })
  }

  return toAppointmentResponseDto(appointment)
}

export async function bookAppointmentAsPatient(
  patientId: string,
  dto: BookAppointmentAsPatientRequestDto,
): Promise<AppointmentResponseDto> {
  const patient = await patientRepository.findFirst({ id: patientId })

  if (!patient) {
    throw new NotFoundError('Patient not found')
  }

  await assertPatientBookingAllowed(patient.clinicId)

  const date = new Date(dto.date)

  await assertDoctorAvailable({
    clinicId: patient.clinicId,
    doctorId: dto.doctorId,
    date,
    startTime: dto.startTime,
    endTime: dto.endTime,
  })

  const appointment = await appointmentRepository.create({
    clinicId: patient.clinicId,
    doctorId: dto.doctorId,
    patientId: patient.id,
    subject: dto.subject,
    description: dto.description,
    date,
    startTime: dto.startTime,
    endTime: dto.endTime,
    createdByType: AppointmentCreatedByType.PATIENT,
  })

  return toAppointmentResponseDto(appointment)
}

export async function createAppointmentByStaff(
  dto: CreateAppointmentByStaffRequestDto,
  authenticatedClinicId?: string,
): Promise<AppointmentResponseDto> {
  const clinicId = dto.clinicId || authenticatedClinicId

  if (!clinicId) {
    throw new ConflictError('clinicId is required')
  }

  const clinic = await clinicRepository.findById(clinicId)
  if (!clinic) {
    throw new NotFoundError('Clinic not found')
  }

  const date = new Date(dto.date)
  await assertDoctorAvailable({
    clinicId,
    doctorId: dto.doctorId,
    date,
    startTime: dto.startTime,
    endTime: dto.endTime,
  })

  // Same reasoning as bookAppointmentAnonymous: the possible new-patient
  // insert and the appointment insert must commit or roll back together.
  const appointment = await unitOfWork(async (tx) => {
    const patient = await resolveOrCreatePatient(
      {
        clinicId,
        patientId: dto.patientId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        dateOfBirth: dto.dateOfBirth,
      },
      undefined,
      tx,
    )

    const createData: Prisma.AppointmentUncheckedCreateInput = {
      clinicId,
      doctorId: dto.doctorId,
      patientId: patient.id,
      subject: dto.subject,
      description: dto.description,
      date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      createdByType: authenticatedClinicId
        ? AppointmentCreatedByType.CLINIC_USER
        : AppointmentCreatedByType.ADMIN_USER,
    }

    return appointmentRepository.create(createData, tx)
  })

  return toAppointmentResponseDto(appointment)
}

function emptyStatusCounts(): AppointmentStatusCounts {
  return {
    total: 0,
    booked: 0,
    approved: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0,
    notShow: 0,
  }
}

function addToStatusCounts(
  counts: AppointmentStatusCounts,
  status: AppointmentStatus,
): void {
  counts.total += 1
  switch (status) {
    case 'BOOKED':
      counts.booked += 1
      break
    case 'APPROVED':
      counts.approved += 1
      break
    case 'COMPLETED':
      counts.completed += 1
      break
    case 'CANCELLED':
      counts.cancelled += 1
      break
    case 'REJECTED':
      counts.rejected += 1
      break
    case 'NOT_SHOW':
      counts.notShow += 1
      break
  }
}

/** Counts appointments by status within [from, to] (inclusive, by day) for the clinic. */
export async function getAppointmentStatusCounts(
  dto: AppointmentStatusCountsDto,
  authenticatedClinicId?: string,
): Promise<AppointmentStatusCounts> {
  const where = withScope(
    {
      date: { gte: startOfDay(dto.from), lte: endOfDay(dto.to) },
      ...(dto.clinicId && { clinicId: dto.clinicId }),
    },
    authenticatedClinicId,
  )

  const { data: appointments } = await appointmentRepository.findAll({
    where,
  })

  const counts = emptyStatusCounts()
  for (const appointment of appointments) {
    addToStatusCounts(counts, appointment.status)
  }

  return counts
}

export async function getAppointments(
  params: GetAppointmentsParamsDto,
): Promise<{ data: AppointmentResponseDto[]; meta: PaginationMeta }> {
  const { skip, take, page, limit } = getPaginationParams(params as any)

  const where = withScope(
    {
      ...(params.clinicId && { clinicId: params.clinicId }),
      ...(params.doctorId && { doctorId: params.doctorId }),
      ...(params.patientId && { patientId: params.patientId }),
      ...(params.status && { status: params.status }),
      ...(params.date && {
        date: { gte: startOfDay(params.date), lte: endOfDay(params.date) },
      }),
    },
    params.authenticatedClinicId,
  )

  const { data, total } = await appointmentRepository.findAll<FullAppointment>({
    where,
    orderBy: { date: params.sortOrder ?? 'desc' },
    skip,
    take,
    include: { patient: true, doctor: true },
  })

  return {
    data: data.map(toAppointmentResponseDto),
    meta: buildPaginationMeta(page, limit, total),
  }
}

export async function getAppointmentById(
  id: string,
  authenticatedClinicId?: string,
): Promise<AppointmentResponseDto> {
  const where = withScope({ id }, authenticatedClinicId)
  const appointment = await appointmentRepository.findFirst<FullAppointment>(
    where,
    { include: { patient: true, doctor: true } },
  )
  if (!appointment) {
    throw new NotFoundError('Appointment not found')
  }
  return toAppointmentResponseDto(appointment)
}

export async function getMyAppointments(
  patientId: string,
  params: PaginationParams & { status?: AppointmentStatus },
): Promise<{ data: AppointmentResponseDto[]; meta: PaginationMeta }> {
  const { skip, take, page, limit } = getPaginationParams(params as any)

  const where: Prisma.AppointmentWhereInput = {
    patientId,
    ...(params.status && { status: params.status }),
  }

  const { data, total } = await appointmentRepository.findAll<FullAppointment>({
    where,
    orderBy: { date: params.sortOrder ?? 'desc' },
    skip,
    take,
    include: { patient: true, doctor: true },
  })

  return {
    data: data.map(toAppointmentResponseDto),
    meta: buildPaginationMeta(page, limit, total),
  }
}

export async function getMyAppointmentById(
  patientId: string,
  id: string,
): Promise<AppointmentResponseDto> {
  const appointment = await appointmentRepository.findFirst<FullAppointment>(
    { id, patientId },
    { include: { patient: true, doctor: true } },
  )

  if (!appointment) {
    throw new NotFoundError('Appointment not found')
  }

  return toAppointmentResponseDto(appointment)
}

async function transitionAppointmentStatus(
  params: TransitionAppointmentStatusDto,
): Promise<AppointmentResponseDto> {
  const { id, toStatus, authenticatedClinicId, restrictToPatientId, reason } =
    params

  const where = restrictToPatientId
    ? withScope({ id }, restrictToPatientId, 'patientId')
    : withScope({ id }, authenticatedClinicId)

  const appointment = await appointmentRepository.findFirst(where)

  if (!appointment) {
    throw new NotFoundError('Appointment not found')
  }

  if (toStatus === appointment.status) {
    throw new ConflictError(
      `Appointment is already ${appointment.status.toLowerCase()} and cannot be changed further`,
    )
  }

  const updateData: Prisma.AppointmentUncheckedUpdateInput = {
    status: toStatus,
  }
  if (toStatus === AppointmentStatus.CANCELLED) {
    updateData.cancelledAt = new Date()
    updateData.cancellationReason = reason ?? null
  }
  if (toStatus === AppointmentStatus.REJECTED) {
    updateData.rejectedAt = new Date()
    updateData.rejectionReason = reason ?? null
  }

  const updated = await appointmentRepository.updateOne(where, updateData)

  if (toStatus === AppointmentStatus.REJECTED) {
    const fullAppointment =
      await appointmentRepository.findFirst<FullAppointment>(
        { id: updated.id },
        { include: { patient: true } },
      )

    if (fullAppointment) {
      void notifyAppointmentRejected({
        appointmentId: fullAppointment.id,
        clinicId: fullAppointment.clinicId,
        patientId: fullAppointment.patientId,
        patientPhone: fullAppointment.patient.phone,
        patientName: `${fullAppointment.patient.firstName} ${fullAppointment.patient.lastName}`,
        date: fullAppointment.date,
        startTime: fullAppointment.startTime,
      })
    }
  }

  return toAppointmentResponseDto(updated)
}

export async function approveAppointment(
  id: string,
  authenticatedClinicId?: string,
): Promise<AppointmentResponseDto> {
  return await transitionAppointmentStatus({
    id,
    toStatus: AppointmentStatus.APPROVED,
    authenticatedClinicId,
  })
}

export async function completeAppointment(
  id: string,
  authenticatedClinicId?: string,
): Promise<AppointmentResponseDto> {
  return await transitionAppointmentStatus({
    id,
    toStatus: AppointmentStatus.COMPLETED,
    authenticatedClinicId,
  })
}

export async function rejectAppointment(
  id: string,
  authenticatedClinicId?: string,
  reason?: string,
): Promise<AppointmentResponseDto> {
  return await transitionAppointmentStatus({
    id,
    toStatus: AppointmentStatus.REJECTED,
    authenticatedClinicId,
    reason,
  })
}

export async function markAppointmentNotShown(
  id: string,
  authenticatedClinicId?: string,
): Promise<AppointmentResponseDto> {
  return transitionAppointmentStatus({
    id,
    toStatus: AppointmentStatus.NOT_SHOW,
    authenticatedClinicId,
  })
}

// Only admins and patients (their own appointment) may cancel — clinic
// staff are intentionally not given a cancel route.
export async function cancelAppointmentByAdmin(
  id: string,
  reason?: string,
): Promise<AppointmentResponseDto> {
  return await transitionAppointmentStatus({
    id,
    toStatus: AppointmentStatus.CANCELLED,
    reason,
  })
}

const PATIENT_MODIFIABLE_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.BOOKED,
  AppointmentStatus.APPROVED,
]

async function assertPatientCanModify(
  id: string,
  patientId: string,
): Promise<Appointment> {
  const where = withScope({ id }, patientId, 'patientId')
  const appointment = await appointmentRepository.findFirst(where)

  if (!appointment) {
    throw new NotFoundError('Appointment not found')
  }

  if (!PATIENT_MODIFIABLE_STATUSES.includes(appointment.status)) {
    throw new ConflictError(
      'Only booked or approved appointments can be changed',
    )
  }

  return appointment
}

export async function cancelAppointmentByPatient(
  id: string,
  patientId: string,
  reason?: string,
): Promise<AppointmentResponseDto> {
  await assertPatientCanModify(id, patientId)

  return await transitionAppointmentStatus({
    id,
    toStatus: AppointmentStatus.CANCELLED,
    restrictToPatientId: patientId,
    reason,
  })
}

export async function rescheduleAppointmentByPatient(
  id: string,
  patientId: string,
  dto: RescheduleAppointmentRequestDto,
): Promise<AppointmentResponseDto> {
  const appointment = await assertPatientCanModify(id, patientId)

  const date = new Date(dto.date)

  await assertDoctorAvailable({
    clinicId: appointment.clinicId,
    doctorId: appointment.doctorId,
    date,
    startTime: dto.startTime,
    endTime: dto.endTime,
    excludeAppointmentId: appointment.id,
  })

  const updated = await appointmentRepository.updateOne(
    { id: appointment.id },
    {
      date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      // Rescheduling re-opens the appointment for the clinic to re-approve.
      status: AppointmentStatus.BOOKED,
    },
  )

  return toAppointmentResponseDto(updated)
}

/**
 * Validates that the doctor has an active availability window covering
 * [startTime, endTime) on the appointment's day of week, and that no other
 * slot-blocking appointment for that doctor overlaps the same date/time.
 * Throws ConflictError otherwise.
 */
export async function assertDoctorAvailable(params: {
  clinicId: string
  doctorId: string
  date: Date
  startTime: string
  endTime: string
  excludeAppointmentId?: string
}): Promise<void> {
  const { clinicId, doctorId, date, startTime, endTime, excludeAppointmentId } =
    params

  if (computeDurationMinutes(startTime, endTime) <= 0) {
    throw new ConflictError('endTime must be after startTime')
  }

  const dayOfWeek = getDayOfWeek(date)

  const { data: availabilities } = await doctorAvailabilityRepository.findAll({
    where: { clinicId, doctorId, dayOfWeek, isActive: true },
  })

  const isWithinAvailability = availabilities.some(
    (availability) =>
      timeToMinutes(availability.startTime) <= timeToMinutes(startTime) &&
      timeToMinutes(availability.endTime) >= timeToMinutes(endTime),
  )

  if (!isWithinAvailability) {
    throw new ConflictError('Doctor is not available at the requested time')
  }

  if (await isDoctorBlocked(doctorId, date, startTime, endTime)) {
    throw new ConflictError('Doctor is unavailable during this time')
  }

  const existingAppointments = await getExistingAppointments({
    doctorId,
    date,
    excludeAppointmentId,
  })

  const hasConflict = existingAppointments.some((appointment) =>
    timeRangesOverlap(
      appointment.startTime,
      appointment.endTime,
      startTime,
      endTime,
    ),
  )

  if (hasConflict) {
    throw new ConflictError('Doctor already has an appointment at that time')
  }
}

export async function getExistingAppointments(
  params: GetExistingAppointmentsDto,
): Promise<AppointmentResponseDto[]> {
  const { data: existingAppointments } = await appointmentRepository.findAll({
    where: {
      doctorId: params.doctorId,
      date: { gte: startOfDay(params.date), lte: endOfDay(params.date) },
      status: {
        in: [
          AppointmentStatus.APPROVED,
          AppointmentStatus.BOOKED,
          AppointmentStatus.COMPLETED,
          AppointmentStatus.NOT_SHOW,
        ],
      },
      ...(params.excludeAppointmentId && {
        id: { not: params.excludeAppointmentId },
      }),
    },
  })

  return existingAppointments.map(toAppointmentResponseDto)
}
