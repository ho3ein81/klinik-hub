import { Router } from 'express'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'
import { clinicUserAuthentication } from '../../middleware/clinicUserAuthentication'
import { requireClinicAdmin } from '../../middleware/requireClinicAdmin'
import { find, update } from './clinicSetting.controller'
import { updateClinicSettingSchema } from './clinicSetting.validation'

const router = Router()

router.use(clinicUserAuthentication)
router.use(requireClinicAdmin)

router.get('/', asyncHandler(find))
router.patch('/', validate(updateClinicSettingSchema), asyncHandler(update))

export default router
