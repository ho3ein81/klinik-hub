import { Router } from 'express'
import { findAllPublicStaff, readResource } from './clinicUser.controller'
import {
  clinicUserReadResourcesSchema,
  listPublicStaffSchema,
} from './clinicUser.validation'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'

const router = Router()

router.get(
  '/',
  validate(listPublicStaffSchema),
  asyncHandler(findAllPublicStaff),
)

router.get(
  '/read-resources/:resourceField/:resourceValue',
  validate(clinicUserReadResourcesSchema),
  asyncHandler(readResource),
)

export default router
