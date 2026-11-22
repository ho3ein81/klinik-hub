import { Router } from 'express'
import {
  create,
  findAll,
  findOne,
  update,
  remove,
  activate,
  deactivate,
  getAvailableSlots,
  getFirstAvailableSlot,
} from './doctorAvailability.controller'
import {
  createDoctorAvailabilitySchema,
  doctorAvailabilityIdSchema,
  getAvailableSlotsSchema,
  getFirstAvailableSlotSchema,
  listDoctorAvailabilitiesSchema,
  updateDoctorAvailabilitySchema,
} from './doctorAvailability.validation'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'
import { clinicUserAuthentication } from '../../middleware/clinicUserAuthentication'
import { requireDoctorOrAdmin } from '../../middleware/requireClinicAdmin'

const router = Router()

router.use(clinicUserAuthentication)

// Any authenticated clinic user (not just doctors/admins) can read slot
// availability — nurses and receptionists book appointments too. Must be
// registered before `requireDoctorOrAdmin` and before `/:id`, otherwise the
// latter would either 403 non-admin staff or swallow "slots" as an id.
router.get(
  '/slots',
  validate(getAvailableSlotsSchema),
  asyncHandler(getAvailableSlots),
)

router.get(
  '/slots/first-available',
  validate(getFirstAvailableSlotSchema),
  asyncHandler(getFirstAvailableSlot),
)

router.use(requireDoctorOrAdmin)

router.post('/', validate(createDoctorAvailabilitySchema), asyncHandler(create))

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
