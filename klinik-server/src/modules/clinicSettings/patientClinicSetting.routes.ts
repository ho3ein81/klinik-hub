import { Router } from 'express'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'
import { findPublic } from './clinicSetting.controller'
import { publicClinicSettingSchema } from './clinicSetting.validation'

const router = Router()

router.get(
  '/:clinicId',
  validate(publicClinicSettingSchema),
  asyncHandler(findPublic),
)

export default router
