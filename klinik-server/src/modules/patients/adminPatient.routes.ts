import { Router } from 'express'
import { create, findAll, findOne, update, remove, readResource } from './patient.controller'
import {
  createAdminPatientSchema,
  updatePatientSchema,
  patientIdSchema,
  patientReadResourcesSchema,
  listPatientsSchema,
} from './patient.validation'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'
import { adminUserAuthentication } from '../../middleware/adminUserAuthentication'
import { uploadImage } from '../../middleware/upload'

const router = Router()

router.use(adminUserAuthentication)

router.post(
  '/',
  uploadImage({
    fieldName: 'avatar',
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    sizes: ['t', 'm'],
  }),
  validate(createAdminPatientSchema),
  asyncHandler(create),
)
router.get('/', validate(listPatientsSchema), asyncHandler(findAll))
router.get('/:id', validate(patientIdSchema), asyncHandler(findOne))
router.patch(
  '/:id',
  uploadImage({
    fieldName: 'avatar',
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    sizes: ['t', 'm'],
  }),
  validate(updatePatientSchema),
  asyncHandler(update),
)
router.delete('/:id', validate(patientIdSchema), asyncHandler(remove))

router.get(
  '/read-resources/:resourceField/:resourceValue',
  validate(patientReadResourcesSchema),
  asyncHandler(readResource),
)

export default router
