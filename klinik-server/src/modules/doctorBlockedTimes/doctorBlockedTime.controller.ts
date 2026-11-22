import { Request, Response } from 'express'
import {
  createDoctorBlockedTime,
  deleteDoctorBlockedTime,
  getDoctorBlockedTimeById,
  getDoctorBlockedTimes,
} from './doctorBlockedTime.service'
import { getParam } from '../../utils/request'
import { sendPaginated, successResponse } from '../../utils/response'

export async function create(req: Request, res: Response): Promise<void> {
  const blockedTime = await createDoctorBlockedTime(
    req.body,
    req.clinicUser?.clinicId,
    req.clinicUser?.type,
    req.clinicUser?.id,
  )

  successResponse(
    res,
    blockedTime,
    req.t('doctorBlockedTime.createdSuccess'),
    201,
  )
}

export async function findAll(req: Request, res: Response): Promise<void> {
  const { page, limit, sortBy, sortOrder, doctorId, from, to } =
    req.validatedQuery

  const { data, meta } = await getDoctorBlockedTimes({
    authenticatedClinicId: req.clinicUser?.clinicId,
    callerType: req.clinicUser?.type,
    callerId: req.clinicUser?.id,
    doctorId,
    from,
    to,
    page,
    limit,
    sortBy,
    sortOrder,
  })

  sendPaginated(
    res,
    data,
    meta,
    req.t('doctorBlockedTime.retrievedAllSuccess'),
    200,
  )
}

export async function findOne(req: Request, res: Response): Promise<void> {
  const blockedTime = await getDoctorBlockedTimeById(
    getParam(req.params.id),
    req.clinicUser?.clinicId,
    req.clinicUser?.type,
    req.clinicUser?.id,
  )

  successResponse(
    res,
    blockedTime,
    req.t('doctorBlockedTime.retrievedSuccess'),
    200,
  )
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteDoctorBlockedTime(
    getParam(req.params.id),
    req.clinicUser?.clinicId,
    req.clinicUser?.type,
    req.clinicUser?.id,
  )

  successResponse(res, null, req.t('doctorBlockedTime.deletedSuccess'), 200)
}
