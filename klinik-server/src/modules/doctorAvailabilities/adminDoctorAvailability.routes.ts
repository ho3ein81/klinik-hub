import { Router } from 'express'
import {
  create,
  findAll,
  findOne,
  update,
  remove,
  activate,
  deactivate,
} from './doctorAvailability.controller'
import {
  createAdminDoctorAvailabilitySchema,
  doctorAvailabilityIdSchema,
  listDoctorAvailabilitiesSchema,
  updateDoctorAvailabilitySchema,
} from './doctorAvailability.validation'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'
import { adminUserAuthentication } from '../../middleware/adminUserAuthentication'

const router = Router()

router.use(adminUserAuthentication)

router.post(
  '/',
  validate(createAdminDoctorAvailabilitySchema),
  asyncHandler(create),
)

router.get('/', validate(listDoctorAvailabilitiesSchema), asyncHandler(findAll))

router.get('/:id', validate(doctorAvailabilityIdSchema), asyncHandler(findOne))

router.patch(
  '/:id',
  validate(updateDoctorAvailabilitySchema),
  asyncHandler(update),
)

router.patch('/:id/activate', asyncHandler(activate))

router.patch('/:id/deactivate', asyncHandler(deactivate))

router.delete(
  '/:id',
  validate(doctorAvailabilityIdSchema),
  asyncHandler(remove),
)

export default router
