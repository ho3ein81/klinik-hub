import { Router } from 'express'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'
import { clinicUserAuthentication } from '../../middleware/clinicUserAuthentication'
import {
  create,
  findAll,
  findOne,
  approve,
  complete,
  reject,
  notShow,
  statistics,
} from './appointment.controller'
import {
  createAppointmentSchema,
  appointmentIdSchema,
  rejectAppointmentSchema,
  listAppointmentsSchema,
  getAppointmentStatisticsSchema,
} from './appointment.validation'

const router = Router()

router.use(clinicUserAuthentication)

router.post('/', validate(createAppointmentSchema), asyncHandler(create))
router.get('/', validate(listAppointmentsSchema), asyncHandler(findAll))
router.get(
  '/statistics',
  validate(getAppointmentStatisticsSchema),
  asyncHandler(statistics),
)
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

export default router
