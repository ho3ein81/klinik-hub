import { Request, Response } from 'express'
import {
  activateService,
  createService,
  deactivateService,
  deleteService,
  getServiceById,
  getServices,
  getPublicServiceById,
  updateService,
} from './service.service'
import { getParam } from '../../utils/request'
import { sendPaginated, successResponse } from '../../utils/response'
import { feedFile } from '../../utils/feedFile'
import { env } from '../../config/env'

export async function create(req: Request, res: Response): Promise<void> {
  const service = await createService(req.body, req.clinicUser?.clinicId)
  successResponse(res, service, req.t('service.createdSuccess'), 201)
}

export async function findAll(req: Request, res: Response): Promise<void> {
  const { page, limit, sortBy, sortOrder, isActive } = req.validatedQuery

  const { data, meta } = await getServices({
    authenticatedClinicId: req.clinicUser?.clinicId,
    isActive,
    page,
    limit,
    sortBy,
    sortOrder,
  })

  sendPaginated(res, data, meta, req.t('service.retrievedAllSuccess'), 200)
}

export async function findAllPublic(
  req: Request,
  res: Response,
): Promise<void> {
  const { page, limit, sortBy, sortOrder, clinicId } = req.validatedQuery

  const { data, meta } = await getServices({
    clinicId,
    isActive: true,
    page,
    limit,
    sortBy,
    sortOrder,
  })

  sendPaginated(res, data, meta, req.t('service.retrievedAllSuccess'), 200)
}

export async function findOne(req: Request, res: Response): Promise<void> {
  const service = await getServiceById(
    getParam(req.params.id),
    req.clinicUser?.clinicId,
  )
  successResponse(res, service, req.t('service.retrievedSuccess'), 200)
}

export async function findOnePublic(
  req: Request,
  res: Response,
): Promise<void> {
  const service = await getPublicServiceById(getParam(req.params.id))
  successResponse(res, service, req.t('service.retrievedSuccess'), 200)
}

export async function update(req: Request, res: Response): Promise<void> {
  const service = await updateService(
    getParam(req.params.id),
    req.body,
    req.clinicUser?.clinicId,
  )
  successResponse(res, service, req.t('service.updatedSuccess'), 200)
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteService(getParam(req.params.id))
  successResponse(res, null, req.t('service.deletedSuccess'), 200)
}

export async function activate(req: Request, res: Response): Promise<void> {
  await activateService(getParam(req.params.id), req.clinicUser?.clinicId)

  successResponse(res, null, req.t('service.activatedSuccess'), 200)
}

export async function deactivate(req: Request, res: Response): Promise<void> {
  await deactivateService(getParam(req.params.id), req.clinicUser?.clinicId)

  successResponse(res, null, req.t('service.deactivatedSuccess'), 200)
}

export async function readResource(req: Request, res: Response): Promise<void> {
  return feedFile(
    env.UPLOADS_PATH,
    getParam(req.params.resourceValue),
    res,
    req.validatedQuery?.size,
  )
}
