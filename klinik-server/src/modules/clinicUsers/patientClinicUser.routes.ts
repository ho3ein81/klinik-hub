import { Router } from 'express'
import {
  findAllPublicDoctors,
  findAllPublicStaff,
  readResource,
} from './clinicUser.controller'
import {
  clinicUserReadResourcesSchema,
  listPublicDoctorsSchema,
  listPublicStaffSchema,
} from './clinicUser.validation'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'

const router = Router()

router.get(
  '/',
  validate(listPublicDoctorsSchema),
  asyncHandler(findAllPublicDoctors),
)

router.get(
  '/read-resources/:resourceField/:resourceValue',
  validate(clinicUserReadResourcesSchema),
  asyncHandler(readResource),
)

export default router
