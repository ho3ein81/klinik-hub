import { Router } from 'express'
import { findAllPublic } from './clinicContact.controller'
import { listPublicClinicContactsSchema } from './clinicContact.validation'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'

const router = Router()

router.get(
  '/',
  validate(listPublicClinicContactsSchema),
  asyncHandler(findAllPublic),
)

export default router
