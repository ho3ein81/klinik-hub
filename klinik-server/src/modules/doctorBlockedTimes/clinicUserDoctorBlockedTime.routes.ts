import { Router } from 'express'
import { create, findAll, findOne, remove } from './doctorBlockedTime.controller'
import {
  createDoctorBlockedTimeSchema,
  doctorBlockedTimeIdSchema,
  listDoctorBlockedTimesSchema,
} from './doctorBlockedTime.validation'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'
import { clinicUserAuthentication } from '../../middleware/clinicUserAuthentication'
import { requireDoctorOrAdmin } from '../../middleware/requireClinicAdmin'

const router = Router()

router.use(clinicUserAuthentication)
router.use(requireDoctorOrAdmin)

router.post(
  '/',
  validate(createDoctorBlockedTimeSchema),
  asyncHandler(create),
)

router.get('/', validate(listDoctorBlockedTimesSchema), asyncHandler(findAll))

router.get('/:id', validate(doctorBlockedTimeIdSchema), asyncHandler(findOne))

router.delete(
  '/:id',
  validate(doctorBlockedTimeIdSchema),
  asyncHandler(remove),
)

export default router
