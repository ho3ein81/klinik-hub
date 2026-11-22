import { Request, Response, NextFunction } from 'express'
import {
  createClinic,
  deleteClinic,
  getClinicById,
  getClinics,
  updateClinic,
} from './clinic.service'
import { get } from 'http'
import { getParam } from '../../utils/request'
import { sendPaginated, successResponse } from '../../utils/response'
import { activateService, deactivateService } from '../services/service.service'
import { feedFile } from '../../utils/feedFile'
import { env } from '../../config/env'

export async function create(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const clinic = await createClinic(req.body)

    res.status(201).json({
      success: true,
      data: clinic,
    })
  } catch (error) {
    next(error)
  }
}

export async function findAll(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { page, limit, sortBy, sortOrder } = req.validatedQuery
  const { data, meta } = await getClinics({
    authenticatedClinicId: req.clinicUser?.clinicId,
    page,
    limit,
    sortBy,
    sortOrder,
  })
  sendPaginated(res, data, meta, 'Clinics retrieved successfully', 200)
}

export async function findOne(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const clinic = await getClinicById(
    getParam(req.params.id),
    req.clinicUser?.clinicId,
  )
  successResponse(res, clinic, 'Clinic retrieved successfully', 200)
}

export async function findOnePublic(
  req: Request,
  res: Response,
): Promise<void> {
  const clinic = await getClinicById(getParam(req.params.id))
  successResponse(res, clinic, 'Clinic retrieved successfully', 200)
}

export async function update(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const clinic = await updateClinic(
    getParam(req.params.id),
    req.body,
    req.clinicUser?.clinicId,
  )
  successResponse(res, clinic, 'Clinic updated successfully', 200)
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  await deleteClinic(getParam(req.params.id), req.clinicUser?.clinicId)
  successResponse(res, null, 'Clinic deleted successfully', 200)
}

export async function activate(req: Request, res: Response): Promise<void> {
  await activateService(getParam(req.params.id), req.clinicUser?.clinicId)

  successResponse(res, null, 'Clinic activated successfully', 200)
}

export async function deactivate(req: Request, res: Response): Promise<void> {
  await deactivateService(getParam(req.params.id), req.clinicUser?.clinicId)

  successResponse(res, null, 'Clinic deactivated successfully', 200)
}

export async function readResource(req: Request, res: Response): Promise<void> {
  return feedFile(
    env.UPLOADS_PATH,
    getParam(req.params.resourceValue),
    res,
    req.validatedQuery?.size,
  )
}
