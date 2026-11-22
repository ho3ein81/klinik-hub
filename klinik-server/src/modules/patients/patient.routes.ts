import { Router } from 'express'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'
import {
  requestOtp,
  login,
  me,
  updateMe,
  readResource,
  refreshToken,
} from './patient.controller'
import {
  patientReadResourcesSchema,
  requestPatientOtpSchema,
  loginPatientSchema,
  refreshTokenSchema,
  updateMyPatientProfileSchema,
} from './patient.validation'
import { patientAuthentication } from '../../middleware/patientAuthentication'
import { uploadImage } from '../../middleware/upload'

const router = Router()

router.post(
  '/request-otp',
  validate(requestPatientOtpSchema),
  asyncHandler(requestOtp),
)
router.post('/login', validate(loginPatientSchema), asyncHandler(login))
router.post(
  '/refresh-token',
  validate(refreshTokenSchema),
  asyncHandler(refreshToken),
)

router.get('/me', patientAuthentication, asyncHandler(me))
router.patch(
  '/me',
  patientAuthentication,
  uploadImage({
    fieldName: 'avatar',
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    sizes: ['t', 'm'],
  }),
  validate(updateMyPatientProfileSchema),
  asyncHandler(updateMe),
)
router.get(
  '/read-resources/:resourceField/:resourceValue',
  validate(patientReadResourcesSchema),
  asyncHandler(readResource),
)

export default router
