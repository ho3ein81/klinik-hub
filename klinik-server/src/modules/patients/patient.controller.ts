import { Request, Response } from 'express'
import {
  createPatient,
  deletePatient,
  getPatientById,
  getPatients,
  loginPatient,
  refreshPatientToken,
  requestPatientOtp,
  updatePatient,
} from './patient.service'
import { getParam } from '../../utils/request'
import { sendPaginated, successResponse } from '../../utils/response'
import { feedFile } from '../../utils/feedFile'
import { env } from '../../config/env'
import { UnauthorizedError } from '../../utils/errors'

export async function requestOtp(req: Request, res: Response): Promise<void> {
  await requestPatientOtp(req.body.phone)
  successResponse(res, null, req.t('patient.otpSentSuccess'), 200)
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await loginPatient(req.body)
  successResponse(res, result, req.t('patient.loginSuccess'), 200)
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  const result = await refreshPatientToken(req.body.refreshToken)
  successResponse(res, result, req.t('patient.refreshedSuccess'), 200)
}

export async function me(req: Request, res: Response): Promise<void> {
  const patient = req.patient
  if (!patient) {
    throw new UnauthorizedError('patient.notAuthenticated')
  }
  const result = await getPatientById(patient.id)
  successResponse(res, result, req.t('patient.retrievedSuccess'), 200)
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const patient = req.patient
  if (!patient) {
    throw new UnauthorizedError('patient.notAuthenticated')
  }
  const result = await updatePatient(patient.id, req.body)
  successResponse(res, result, req.t('patient.updatedSuccess'), 200)
}

export async function create(req: Request, res: Response): Promise<void> {
  const patient = await createPatient(req.body, req.clinicUser?.clinicId)
  successResponse(res, patient, req.t('patient.createdSuccess'), 201)
}

export async function findAll(req: Request, res: Response): Promise<void> {
  const { page, limit, sortBy, sortOrder, search, clinicId } =
    req.validatedQuery

  const { data, meta } = await getPatients({
    authenticatedClinicId: req.clinicUser?.clinicId,
    clinicId,
    search,
    page,
    limit,
    sortBy,
    sortOrder,
  })

  sendPaginated(res, data, meta, req.t('patient.retrievedAllSuccess'), 200)
}

export async function findOne(req: Request, res: Response): Promise<void> {
  const patient = await getPatientById(
    getParam(req.params.id),
    req.clinicUser?.clinicId,
  )
  successResponse(res, patient, req.t('patient.retrievedSuccess'), 200)
}

export async function update(req: Request, res: Response): Promise<void> {
  const patient = await updatePatient(
    getParam(req.params.id),
    req.body,
    req.clinicUser?.clinicId,
  )
  successResponse(res, patient, req.t('patient.updatedSuccess'), 200)
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deletePatient(getParam(req.params.id), req.clinicUser?.clinicId)
  successResponse(res, null, req.t('patient.deletedSuccess'), 200)
}

export async function readResource(req: Request, res: Response): Promise<void> {
  return feedFile(
    env.UPLOADS_PATH,
    getParam(req.params.resourceValue),
    res,
    req.validatedQuery?.size,
  )
}
