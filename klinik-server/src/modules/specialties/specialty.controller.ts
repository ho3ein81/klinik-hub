import { Request, Response } from 'express'
import {
  activateSpecialty,
  createSpecialty,
  deactivateSpecialty,
  deleteSpecialty,
  getSpecialtyById,
  getSpecialties,
  updateSpecialty,
} from './specialty.service'
import { getParam } from '../../utils/request'
import { sendPaginated, successResponse } from '../../utils/response'

export async function create(req: Request, res: Response): Promise<void> {
  const specialty = await createSpecialty(req.body, req.clinicUser?.clinicId)
  successResponse(res, specialty, req.t('specialty.createdSuccess'), 201)
}

export async function findAll(req: Request, res: Response): Promise<void> {
  const { page, limit, sortBy, sortOrder, isActive } = req.validatedQuery

  const { data, meta } = await getSpecialties({
    authenticatedClinicId: req.clinicUser?.clinicId,
    isActive,
    page,
    limit,
    sortBy,
    sortOrder,
  })

  sendPaginated(res, data, meta, req.t('specialty.retrievedAllSuccess'), 200)
}

export async function findOne(req: Request, res: Response): Promise<void> {
  const specialty = await getSpecialtyById(
    getParam(req.params.id),
    req.clinicUser?.clinicId,
  )
  successResponse(res, specialty, req.t('specialty.retrievedSuccess'), 200)
}

export async function update(req: Request, res: Response): Promise<void> {
  const specialty = await updateSpecialty(
    getParam(req.params.id),
    req.body,
    req.clinicUser?.clinicId,
  )
  successResponse(res, specialty, req.t('specialty.updatedSuccess'), 200)
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteSpecialty(getParam(req.params.id), req.clinicUser?.clinicId)
  successResponse(res, null, req.t('specialty.deletedSuccess'), 200)
}

export async function activate(req: Request, res: Response): Promise<void> {
  await activateSpecialty(getParam(req.params.id), req.clinicUser?.clinicId)

  successResponse(res, null, req.t('specialty.activatedSuccess'), 200)
}

export async function deactivate(req: Request, res: Response): Promise<void> {
  await deactivateSpecialty(getParam(req.params.id), req.clinicUser?.clinicId)

  successResponse(res, null, req.t('specialty.deactivatedSuccess'), 200)
}
