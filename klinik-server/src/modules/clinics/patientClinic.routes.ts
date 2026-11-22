import { Router } from 'express'
import { findOnePublic, readResource } from './clinic.controller'
import { clinicIdSchema, clinicReadResourcesSchema } from './clinic.validation'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'

const router = Router()

router.get('/:id', validate(clinicIdSchema), asyncHandler(findOnePublic))

router.get(
  '/read-resources/:resourceField/:resourceValue',
  validate(clinicReadResourcesSchema),
  asyncHandler(readResource),
)

export default router
