import { Router } from 'express'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'
import {
  findAllPublic,
  getAvailableSlots,
  getFirstAvailableSlot,
} from './doctorAvailability.controller'
import {
  getAvailableSlotsSchema,
  getFirstAvailableSlotSchema,
  listPublicDoctorAvailabilitiesSchema,
} from './doctorAvailability.validation'

const router = Router()

router.get(
  '/',
  validate(listPublicDoctorAvailabilitiesSchema),
  asyncHandler(findAllPublic),
)

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

export default router
