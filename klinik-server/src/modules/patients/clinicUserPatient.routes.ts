import { Router } from 'express'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'
import { clinicUserAuthentication } from '../../middleware/clinicUserAuthentication'
import {
  create,
  findAll,
  findOne,
  update,
  remove,
  readResource,
} from './patient.controller'
import {
  createPatientSchema,
  updatePatientSchema,
  patientIdSchema,
  patientReadResourcesSchema,
  listPatientsSchema,
} from './patient.validation'
import { uploadImage } from '../../middleware/upload'

const router = Router()

router.use(clinicUserAuthentication)
router.post(
  '/',
  uploadImage({
    fieldName: 'avatar',
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    sizes: ['t', 'm'],
  }),
  validate(createPatientSchema),
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
