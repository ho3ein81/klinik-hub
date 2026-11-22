import { Request, Response, NextFunction } from 'express'
import {
  getAdminUserById,
  loginAdminUser,
  createAdminUser,
  getAdminUsers,
  updateAdminUser,
  deleteAdminUser,
  activateAdminUser,
  deactivateAdminUser,
} from './adminUser.service'
import { getParam } from '../../utils/request'
import { sendPaginated, successResponse } from '../../utils/response'
import { UnauthorizedError } from '../../utils/errors'

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const result = await loginAdminUser(req.body)
  successResponse(res, result, req.t('adminUser.loginSuccess'), 200)
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const adminUser = req.adminUser

  if (!adminUser) {
    throw new UnauthorizedError('adminUser.notAuthenticated')
  }
  const result = await getAdminUserById(adminUser.id)
  successResponse(res, result, req.t('adminUser.retrievedSuccess'), 200)
}

export async function create(req: Request, res: Response): Promise<void> {
  const user = await createAdminUser(req.body)
  successResponse(res, user, req.t('adminUser.createdSuccess'), 201)
}

export async function findAll(req: Request, res: Response): Promise<void> {
  const { page, limit, sortBy, sortOrder } = req.validatedQuery
  const { data, meta } = await getAdminUsers({
    page,
    limit,
    sortBy,
    sortOrder,
  })
  sendPaginated(res, data, meta, req.t('adminUser.retrievedAllSuccess'), 200)
}

export async function findOne(req: Request, res: Response): Promise<void> {
  const user = await getAdminUserById(getParam(req.params.id))
  successResponse(res, user, req.t('adminUser.retrievedSuccess'), 200)
}

export async function update(req: Request, res: Response): Promise<void> {
  const user = await updateAdminUser(getParam(req.params.id), req.body)
  successResponse(res, user, req.t('adminUser.updatedSuccess'), 200)
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteAdminUser(getParam(req.params.id))
  successResponse(res, null, req.t('adminUser.deletedSuccess'), 200)
}

export async function activate(req: Request, res: Response): Promise<void> {
  await activateAdminUser(getParam(req.params.id))

  successResponse(res, null, req.t('adminUser.activatedSuccess'), 200)
}

export async function deactivate(req: Request, res: Response): Promise<void> {
  await deactivateAdminUser(getParam(req.params.id))

  successResponse(res, null, req.t('adminUser.deactivatedSuccess'), 200)
}
