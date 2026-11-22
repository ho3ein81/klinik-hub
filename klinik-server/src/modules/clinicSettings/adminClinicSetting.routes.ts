import { Router } from 'express'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'
import { adminUserAuthentication } from '../../middleware/adminUserAuthentication'
import { findByClinicId, updateByClinicId } from './clinicSetting.controller'
import {
  adminClinicSettingParamsSchema,
  updateAdminClinicSettingSchema,
} from './clinicSetting.validation'

const router = Router()

router.use(adminUserAuthentication)

router.get(
  '/:clinicId',
  validate(adminClinicSettingParamsSchema),
  asyncHandler(findByClinicId),
)
router.patch(
  '/:clinicId',
  validate(updateAdminClinicSettingSchema),
  asyncHandler(updateByClinicId),
)

export default router
