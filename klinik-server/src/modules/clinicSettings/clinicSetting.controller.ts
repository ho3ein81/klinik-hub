import { Request, Response } from 'express'
import { UnauthorizedError } from '../../utils/errors'
import { successResponse } from '../../utils/response'
import { getParam } from '../../utils/request'
import {
  getClinicSetting,
  getPublicClinicSetting,
  updateClinicSetting,
} from './clinicSetting.service'

export async function find(req: Request, res: Response): Promise<void> {
  const clinicId = req.clinicUser?.clinicId
  if (!clinicId) {
    throw new UnauthorizedError('clinicUser.notAuthenticated')
  }
  const setting = await getClinicSetting(clinicId)
  successResponse(res, setting, req.t('clinicSetting.retrievedSuccess'), 200)
}

export async function update(req: Request, res: Response): Promise<void> {
  const clinicId = req.clinicUser?.clinicId
  if (!clinicId) {
    throw new UnauthorizedError('clinicUser.notAuthenticated')
  }
  const setting = await updateClinicSetting(clinicId, req.body)
  successResponse(res, setting, req.t('clinicSetting.updatedSuccess'), 200)
}

export async function findPublic(req: Request, res: Response): Promise<void> {
  const setting = await getPublicClinicSetting(getParam(req.params.clinicId))
  successResponse(res, setting, req.t('clinicSetting.retrievedSuccess'), 200)
}

export async function findByClinicId(req: Request, res: Response): Promise<void> {
  const setting = await getClinicSetting(getParam(req.params.clinicId))
  successResponse(res, setting, req.t('clinicSetting.retrievedSuccess'), 200)
}

export async function updateByClinicId(req: Request, res: Response): Promise<void> {
  const setting = await updateClinicSetting(getParam(req.params.clinicId), req.body)
  successResponse(res, setting, req.t('clinicSetting.updatedSuccess'), 200)
}
