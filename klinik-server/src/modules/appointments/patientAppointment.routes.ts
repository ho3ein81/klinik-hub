import { Router } from 'express'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'
import { patientAuthentication } from '../../middleware/patientAuthentication'
import {
  requestOtp,
  bookAnonymous,
  bookAsPatient,
  findMyAppointments,
  findMyAppointment,
  cancelAsPatient,
  rescheduleAsPatient,
} from './appointment.controller'
import {
  requestAppointmentOtpSchema,
  bookAppointmentAnonymousSchema,
  bookAppointmentAsPatientSchema,
  appointmentIdSchema,
  cancelAppointmentSchema,
  listAppointmentsSchema,
  rescheduleAppointmentSchema,
} from './appointment.validation'

const router = Router()

// --- Anonymous booking: requires PHONE_VERIFICATION OTP first ---
router.post(
  '/anonymous/request-otp',
  validate(requestAppointmentOtpSchema),
  asyncHandler(requestOtp),
)
router.post(
  '/anonymous',
  validate(bookAppointmentAnonymousSchema),
  asyncHandler(bookAnonymous),
)

// --- Patient self-service (already logged in — no OTP needed to book) ---
router.use(patientAuthentication)
router.post(
  '/',
  validate(bookAppointmentAsPatientSchema),
  asyncHandler(bookAsPatient),
)
router.get(
  '/',
  validate(listAppointmentsSchema),
  asyncHandler(findMyAppointments),
)
router.get(
  '/:id',
  validate(appointmentIdSchema),
  asyncHandler(findMyAppointment),
)
router.patch(
  '/:id/cancel',
  validate(cancelAppointmentSchema),
  asyncHandler(cancelAsPatient),
)
router.patch(
  '/:id/reschedule',
  validate(rescheduleAppointmentSchema),
  asyncHandler(rescheduleAsPatient),
)

export default router
