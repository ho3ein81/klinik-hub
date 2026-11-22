import { Request, Response } from 'express'
import {
  activateDoctorAvailability,
  createDoctorAvailability,
  deactivateDoctorAvailability,
  deleteDoctorAvailability,
  getDoctorAvailabilities,
  getDoctorAvailabilityById,
  getDoctorAvailabilitySlotsForDate,
  getFirstDoctorAvailabilitySlot,
  getPublicDoctorAvailabilities,
  updateDoctorAvailability,
} from './doctorAvailability.service'
import { getParam } from '../../utils/request'
import { sendPaginated, successResponse } from '../../utils/response'

export async function create(req: Request, res: Response): Promise<void> {
  const availability = await createDoctorAvailability(
    req.body,
    req.clinicUser?.clinicId,
    req.clinicUser?.type,
    req.clinicUser?.id,
  )

  successResponse(
    res,
    availability,
    req.t('doctorAvailability.createdSuccess'),
    201,
  )
}

export async function findAll(req: Request, res: Response): Promise<void> {
  const { page, limit, sortBy, sortOrder, doctorId, dayOfWeek, isActive } =
    req.validatedQuery

  const { data, meta } = await getDoctorAvailabilities({
    authenticatedClinicId: req.clinicUser?.clinicId,
    callerType: req.clinicUser?.type,
    callerId: req.clinicUser?.id,
    doctorId,
    dayOfWeek,
    isActive,
    page,
    limit,
    sortBy,
    sortOrder,
  })

  sendPaginated(
    res,
    data,
    meta,
    req.t('doctorAvailability.retrievedAllSuccess'),
    200,
  )
}

export async function findOne(req: Request, res: Response): Promise<void> {
  const availability = await getDoctorAvailabilityById(
    getParam(req.params.id),
    req.clinicUser?.clinicId,
    req.clinicUser?.type,
    req.clinicUser?.id,
  )

  successResponse(
    res,
    availability,
    req.t('doctorAvailability.retrievedSuccess'),
    200,
  )
}

export async function update(req: Request, res: Response): Promise<void> {
  const availability = await updateDoctorAvailability(
    getParam(req.params.id),
    req.body,
    req.clinicUser?.clinicId,
    req.clinicUser?.type,
    req.clinicUser?.id,
  )

  successResponse(
    res,
    availability,
    req.t('doctorAvailability.updatedSuccess'),
    200,
  )
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteDoctorAvailability(
    getParam(req.params.id),
    req.clinicUser?.clinicId,
    req.clinicUser?.type,
    req.clinicUser?.id,
  )

  successResponse(res, null, req.t('doctorAvailability.deletedSuccess'), 200)
}

export async function activate(req: Request, res: Response): Promise<void> {
  await activateDoctorAvailability(
    getParam(req.params.id),
    req.clinicUser?.clinicId,
    req.clinicUser?.type,
    req.clinicUser?.id,
  )

  successResponse(res, null, req.t('doctorAvailability.activatedSuccess'), 200)
}

export async function deactivate(req: Request, res: Response): Promise<void> {
  await deactivateDoctorAvailability(
    getParam(req.params.id),
    req.clinicUser?.clinicId,
    req.clinicUser?.type,
    req.clinicUser?.id,
  )

  successResponse(
    res,
    null,
    req.t('doctorAvailability.deactivatedSuccess'),
    200,
  )
}

export async function findAllPublic(req: Request, res: Response): Promise<void> {
  const { doctorId } = req.validatedQuery

  const data = await getPublicDoctorAvailabilities(doctorId)

  successResponse(
    res,
    data,
    req.t('doctorAvailability.retrievedAllSuccess'),
    200,
  )
}

export const getAvailableSlots = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { doctorId, date } = req.validatedQuery

  const slots = await getDoctorAvailabilitySlotsForDate(
    doctorId,
    new Date(date),
  )

  successResponse(
    res,
    slots,
    req.t('doctorAvailability.slotsRetrievedSuccess'),
    200,
  )
}

export const getFirstAvailableSlot = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { doctorId } = req.validatedQuery

  const slot = await getFirstDoctorAvailabilitySlot(doctorId)

  successResponse(
    res,
    slot,
    req.t('doctorAvailability.firstSlotRetrievedSuccess'),
    200,
  )
}
