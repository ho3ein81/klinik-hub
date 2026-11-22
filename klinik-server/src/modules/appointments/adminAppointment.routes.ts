import { Router } from 'express'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'
import { adminUserAuthentication } from '../../middleware/adminUserAuthentication'
import {
  create,
  findAll,
  findOne,
  approve,
  complete,
  reject,
  notShow,
  cancelByAdmin,
  statistics,
} from './appointment.controller'
import {
  createAdminAppointmentSchema,
  appointmentIdSchema,
  rejectAppointmentSchema,
  cancelAppointmentSchema,
  listAppointmentsSchema,
  getAppointmentStatisticsSchema,
} from './appointment.validation'

const router = Router()

router.use(adminUserAuthentication)

router.post('/', validate(createAdminAppointmentSchema), asyncHandler(create))
router.get('/', validate(listAppointmentsSchema), asyncHandler(findAll))
router.get('/:id', validate(appointmentIdSchema), asyncHandler(findOne))
router.patch(
  '/:id/approve',
  validate(appointmentIdSchema),
  asyncHandler(approve),
)
router.patch(
  '/:id/complete',
  validate(appointmentIdSchema),
  asyncHandler(complete),
)
router.patch(
  '/:id/reject',
  validate(rejectAppointmentSchema),
  asyncHandler(reject),
)
router.patch(
  '/:id/not-show',
  validate(appointmentIdSchema),
  asyncHandler(notShow),
)
router.patch(
  '/:id/cancel',
  validate(cancelAppointmentSchema),
  asyncHandler(cancelByAdmin),
)
router.get(
  '/statistics',
  validate(getAppointmentStatisticsSchema),
  asyncHandler(statistics),
)

export default router
