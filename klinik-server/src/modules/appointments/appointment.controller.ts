import { Request, Response } from 'express'
import { UnauthorizedError } from '../../utils/errors'
import { getParam } from '../../utils/request'
import { sendPaginated, successResponse } from '../../utils/response'
import {
  approveAppointment,
  bookAppointmentAnonymous,
  bookAppointmentAsPatient,
  cancelAppointmentByAdmin,
  cancelAppointmentByPatient,
  completeAppointment,
  createAppointmentByStaff,
  getAppointmentById,
  getAppointments,
  getAppointmentStatusCounts,
  getMyAppointmentById,
  getMyAppointments,
  markAppointmentNotShown,
  rejectAppointment,
  requestAppointmentOtp,
  rescheduleAppointmentByPatient,
} from './appointment.service'

export async function requestOtp(req: Request, res: Response): Promise<void> {
  await requestAppointmentOtp(req.body.phone)
  successResponse(res, null, req.t('appointment.otpSentSuccess'), 200)
}

export async function bookAnonymous(
  req: Request,
  res: Response,
): Promise<void> {
  const appointment = await bookAppointmentAnonymous(req.body)
  successResponse(res, appointment, req.t('appointment.bookedSuccess'), 201)
}

export async function bookAsPatient(
  req: Request,
  res: Response,
): Promise<void> {
  const patient = req.patient
  if (!patient) {
    throw new UnauthorizedError('patient.notAuthenticated')
  }
  const appointment = await bookAppointmentAsPatient(patient.id, req.body)
  successResponse(res, appointment, req.t('appointment.bookedSuccess'), 201)
}

export async function findMyAppointments(
  req: Request,
  res: Response,
): Promise<void> {
  const patient = req.patient
  if (!patient) {
    throw new UnauthorizedError('patient.notAuthenticated')
  }

  const { page, limit, sortBy, sortOrder, status } = req.validatedQuery

  const { data, meta } = await getMyAppointments(patient.id, {
    page,
    limit,
    sortBy,
    sortOrder,
    status,
  })

  sendPaginated(res, data, meta, req.t('appointment.retrievedAllSuccess'), 200)
}

export async function findMyAppointment(
  req: Request,
  res: Response,
): Promise<void> {
  const patient = req.patient
  if (!patient) {
    throw new UnauthorizedError('patient.notAuthenticated')
  }
  const appointment = await getMyAppointmentById(
    patient.id,
    getParam(req.params.id),
  )
  successResponse(res, appointment, req.t('appointment.retrievedSuccess'), 200)
}

export async function cancelAsPatient(
  req: Request,
  res: Response,
): Promise<void> {
  const patient = req.patient
  if (!patient) {
    throw new UnauthorizedError('patient.notAuthenticated')
  }
  const appointment = await cancelAppointmentByPatient(
    getParam(req.params.id),
    patient.id,
    req.body?.reason,
  )
  successResponse(res, appointment, req.t('appointment.cancelledSuccess'), 200)
}

export async function rescheduleAsPatient(
  req: Request,
  res: Response,
): Promise<void> {
  const patient = req.patient
  if (!patient) {
    throw new UnauthorizedError('patient.notAuthenticated')
  }
  const appointment = await rescheduleAppointmentByPatient(
    getParam(req.params.id),
    patient.id,
    req.body,
  )
  successResponse(
    res,
    appointment,
    req.t('appointment.rescheduledSuccess'),
    200,
  )
}

export async function create(req: Request, res: Response): Promise<void> {
  const appointment = await createAppointmentByStaff(
    req.body,
    req.clinicUser?.clinicId,
  )
  successResponse(res, appointment, req.t('appointment.createdSuccess'), 201)
}

export async function findAll(req: Request, res: Response): Promise<void> {
  const {
    page,
    limit,
    sortBy,
    sortOrder,
    clinicId,
    doctorId,
    patientId,
    status,
    date,
  } = req.validatedQuery

  const { data, meta } = await getAppointments({
    authenticatedClinicId: req.clinicUser?.clinicId,
    clinicId,
    doctorId,
    patientId,
    status,
    date,
    page,
    limit,
    sortBy,
    sortOrder,
  })

  sendPaginated(res, data, meta, req.t('appointment.retrievedAllSuccess'), 200)
}

export async function statistics(req: Request, res: Response): Promise<void> {
  const clinicId = req.clinicUser?.clinicId

  const counts = await getAppointmentStatusCounts(req.validatedQuery, clinicId)
  successResponse(
    res,
    counts,
    req.t('appointment.statisticsRetrievedSuccess'),
    200,
  )
}

export async function findOne(req: Request, res: Response): Promise<void> {
  const appointment = await getAppointmentById(
    getParam(req.params.id),
    req.clinicUser?.clinicId,
  )
  successResponse(res, appointment, req.t('appointment.retrievedSuccess'), 200)
}

export async function approve(req: Request, res: Response): Promise<void> {
  const appointment = await approveAppointment(
    getParam(req.params.id),
    req.clinicUser?.clinicId,
  )
  successResponse(res, appointment, req.t('appointment.approvedSuccess'), 200)
}

export async function complete(req: Request, res: Response): Promise<void> {
  const appointment = await completeAppointment(
    getParam(req.params.id),
    req.clinicUser?.clinicId,
  )
  successResponse(res, appointment, req.t('appointment.completedSuccess'), 200)
}

export async function reject(req: Request, res: Response): Promise<void> {
  const appointment = await rejectAppointment(
    getParam(req.params.id),
    req.clinicUser?.clinicId,
    req.body?.reason,
  )
  successResponse(res, appointment, req.t('appointment.rejectedSuccess'), 200)
}

export async function notShow(req: Request, res: Response): Promise<void> {
  const appointment = await markAppointmentNotShown(
    getParam(req.params.id),
    req.clinicUser?.clinicId,
  )
  successResponse(
    res,
    appointment,
    req.t('appointment.markedNotShownSuccess'),
    200,
  )
}

// Admin-only route (clinic staff cannot cancel — see appointment.routes.ts)
export async function cancelByAdmin(
  req: Request,
  res: Response,
): Promise<void> {
  const adminUser = req.adminUser
  if (!adminUser) {
    throw new UnauthorizedError('adminUser.notAuthenticated')
  }
  const appointment = await cancelAppointmentByAdmin(
    getParam(req.params.id),
    req.body?.reason,
  )
  successResponse(res, appointment, req.t('appointment.cancelledSuccess'), 200)
}
