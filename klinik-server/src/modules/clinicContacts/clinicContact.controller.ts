import { Request, Response } from 'express'
import {
  createClinicContact,
  deleteClinicContact,
  getClinicContactById,
  getClinicContacts,
  updateClinicContact,
} from './clinicContact.service'
import { getParam } from '../../utils/request'
import { sendPaginated, successResponse } from '../../utils/response'

export async function create(req: Request, res: Response): Promise<void> {
  const contact = await createClinicContact(req.body, req.clinicUser?.clinicId)
  successResponse(res, contact, req.t('clinicContact.createdSuccess'), 201)
}

export async function findAll(req: Request, res: Response): Promise<void> {
  const { page, limit, sortBy, sortOrder, clinicId } = req.validatedQuery
  const { data, meta } = await getClinicContacts({
    authenticatedClinicId: req.clinicUser?.clinicId,
    clinicId: clinicId,
    page,
    limit,
    sortBy,
    sortOrder,
  })
  sendPaginated(
    res,
    data,
    meta,
    req.t('clinicContact.retrievedAllSuccess'),
    200,
  )
}

export async function findAllPublic(req: Request, res: Response): Promise<void> {
  const { page, limit, sortBy, sortOrder, clinicId } = req.validatedQuery
  const { data, meta } = await getClinicContacts({
    clinicId,
    page,
    limit,
    sortBy,
    sortOrder,
  })
  sendPaginated(
    res,
    data,
    meta,
    req.t('clinicContact.retrievedAllSuccess'),
    200,
  )
}

export async function findOne(req: Request, res: Response): Promise<void> {
  const contact = await getClinicContactById(
    getParam(req.params.id),
    req.clinicUser?.clinicId,
  )
  successResponse(res, contact, req.t('clinicContact.retrievedSuccess'), 200)
}

export async function update(req: Request, res: Response): Promise<void> {
  const contact = await updateClinicContact(
    getParam(req.params.id),
    req.body,
    req.clinicUser?.clinicId,
  )
  successResponse(res, contact, req.t('clinicContact.updatedSuccess'), 200)
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteClinicContact(getParam(req.params.id))
  successResponse(res, null, req.t('clinicContact.deletedSuccess'), 200)
}
