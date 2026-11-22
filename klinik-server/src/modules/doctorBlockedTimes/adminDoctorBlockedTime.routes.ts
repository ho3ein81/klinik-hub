import { Router } from 'express'
import { create, findAll, findOne, remove } from './doctorBlockedTime.controller'
import {
  createAdminDoctorBlockedTimeSchema,
  doctorBlockedTimeIdSchema,
  listDoctorBlockedTimesSchema,
} from './doctorBlockedTime.validation'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'
import { adminUserAuthentication } from '../../middleware/adminUserAuthentication'

const router = Router()

router.use(adminUserAuthentication)

router.post(
  '/',
  validate(createAdminDoctorBlockedTimeSchema),
  asyncHandler(create),
)
router.get('/', validate(listDoctorBlockedTimesSchema), asyncHandler(findAll))
router.get('/:id', validate(doctorBlockedTimeIdSchema), asyncHandler(findOne))
router.delete('/:id', validate(doctorBlockedTimeIdSchema), asyncHandler(remove))

export default router
