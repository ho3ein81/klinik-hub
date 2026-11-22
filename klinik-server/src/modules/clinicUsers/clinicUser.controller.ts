import { Request, Response } from 'express'
import {
  activateClinicUser,
  changeClinicUserPassword,
  createClinicUser,
  deactivateClinicUser,
  deleteClinicUser,
  getClinicUserById,
  getClinicUsers,
  getPublicDoctors,
  getPublicStaff,
  loginClinicUser,
  refreshClinicUserToken,
  updateClinicUser,
} from './clinicUser.service'
import { getParam } from '../../utils/request'
import { sendPaginated, successResponse } from '../../utils/response'
import { feedFile } from '../../utils/feedFile'
import { env } from '../../config/env'
import { UnauthorizedError } from '../../utils/errors'

export async function login(req: Request, res: Response): Promise<void> {
  const result = await loginClinicUser(req.body)
  successResponse(res, result, req.t('clinicUser.loginSuccess'), 200)
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = req.clinicUser
  if (!user) {
    throw new UnauthorizedError('clinicUser.notAuthenticated')
  }
  const result = await getClinicUserById(user.id)
  successResponse(res, result, req.t('clinicUser.retrievedSuccess'), 200)
}

export async function create(req: Request, res: Response): Promise<void> {
  const user = await createClinicUser(req.body, req.clinicUser?.clinicId)
  successResponse(res, user, req.t('clinicUser.createdSuccess'), 201)
}

export async function findAll(req: Request, res: Response): Promise<void> {
  const { page, limit, sortBy, sortOrder, type } = req.validatedQuery

  const { data, meta } = await getClinicUsers({
    authenticatedClinicId: req.clinicUser?.clinicId,
    type,
    page,
    limit,
    sortBy,
    sortOrder,
  })

  sendPaginated(res, data, meta, req.t('clinicUser.retrievedAllSuccess'), 200)
}

export async function findAllPublicDoctors(
  req: Request,
  res: Response,
): Promise<void> {
  const { page, limit, sortBy, sortOrder, clinicId } = req.validatedQuery

  const { data, meta } = await getPublicDoctors({
    clinicId,
    page,
    limit,
    sortBy,
    sortOrder,
  })

  sendPaginated(res, data, meta, req.t('clinicUser.retrievedAllSuccess'), 200)
}

export async function findAllPublicStaff(
  req: Request,
  res: Response,
): Promise<void> {
  const { page, limit, sortBy, sortOrder, clinicId } = req.validatedQuery

  const { data, meta } = await getPublicStaff({
    clinicId,
    page,
    limit,
    sortBy,
    sortOrder,
  })

  sendPaginated(res, data, meta, req.t('clinicUser.retrievedAllSuccess'), 200)
}

export async function findOne(req: Request, res: Response): Promise<void> {
  const user = await getClinicUserById(
    getParam(req.params.id),
    req.clinicUser?.clinicId,
  )
  successResponse(res, user, req.t('clinicUser.retrievedSuccess'), 200)
}

export async function update(req: Request, res: Response): Promise<void> {
  const user = await updateClinicUser(
    getParam(req.params.id),
    req.body,
    req.clinicUser?.clinicId,
    req.clinicUser?.type,
  )
  successResponse(res, user, req.t('clinicUser.updatedSuccess'), 200)
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteClinicUser(getParam(req.params.id), req.clinicUser?.clinicId)
  successResponse(res, null, req.t('clinicUser.deletedSuccess'), 200)
}

export async function readResource(req: Request, res: Response): Promise<void> {
  return feedFile(
    env.UPLOADS_PATH,
    getParam(req.params.resourceValue),
    res,
    req.validatedQuery?.size,
  )
}

export async function refreshToken(req: Request, res: Response) {
  const result = await refreshClinicUserToken(req.body.refreshToken)
  successResponse(res, result, req.t('clinicUser.refreshedSuccess'), 200)
}

export async function changePassword(req: Request, res: Response) {
  const user = req.clinicUser
  if (!user) {
    throw new UnauthorizedError('clinicUser.notAuthenticated')
  }

  await changeClinicUserPassword(
    user.id,
    req.body.currentPassword,
    req.body.newPassword,
  )
  successResponse(res, null, req.t('clinicUser.passwordChangedSuccess'), 200)
}

export async function activate(req: Request, res: Response): Promise<void> {
  await activateClinicUser(getParam(req.params.id), req.clinicUser?.clinicId)

  successResponse(res, null, req.t('clinicUser.activatedSuccess'), 200)
}

export async function deactivate(req: Request, res: Response): Promise<void> {
  await deactivateClinicUser(getParam(req.params.id), req.clinicUser?.clinicId)

  successResponse(res, null, req.t('clinicUser.deactivatedSuccess'), 200)
}
