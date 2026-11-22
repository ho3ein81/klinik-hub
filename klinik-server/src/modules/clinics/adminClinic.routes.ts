import { Router } from 'express'
import {
  create,
  findAll,
  findOne,
  update,
  remove,
  activate,
  deactivate,
} from './clinic.controller'
import {
  createClinicSchema,
  updateClinicSchema,
  clinicIdSchema,
  listClinicsSchema,
} from './clinic.validation'
import { validate } from '../../middleware/validate'
import { adminUserAuthentication } from '../../middleware/adminUserAuthentication'
import { uploadImage } from '../../middleware/upload'
import { asyncHandler } from '../../middleware/asyncHandler'

const router = Router()

router.use(adminUserAuthentication)
router.post(
  '/',
  uploadImage({
    fieldName: 'image',
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    sizes: ['m'],
  }),
  validate(createClinicSchema),
  asyncHandler(create),
)
router.get('/', validate(listClinicsSchema), asyncHandler(findAll))
router.get('/:id', validate(clinicIdSchema), asyncHandler(findOne))
router.patch(
  '/:id',
  uploadImage({
    fieldName: 'image',
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    sizes: ['m'],
  }),
  validate(updateClinicSchema),
  asyncHandler(update),
)
router.delete('/:id', validate(clinicIdSchema), asyncHandler(remove))
router.patch('/:id/activate', asyncHandler(activate))
router.patch('/:id/deactivate', asyncHandler(deactivate))

export default router
