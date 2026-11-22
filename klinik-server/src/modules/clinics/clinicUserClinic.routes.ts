import { Router } from 'express'
import {
  findAll,
  findOne,
  update,
  remove,
  activate,
  deactivate,
  readResource,
} from './clinic.controller'
import {
  updateClinicSchema,
  clinicIdSchema,
  listClinicsSchema,
  clinicReadResourcesSchema,
} from './clinic.validation'
import { validate } from '../../middleware/validate'
import { clinicUserAuthentication } from '../../middleware/clinicUserAuthentication'
import { asyncHandler } from '../../middleware/asyncHandler'
import { uploadImage } from '../../middleware/upload'

const router = Router()

router.use(clinicUserAuthentication)
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

router.get(
  '/read-resources/:resourceField/:resourceValue',
  validate(clinicReadResourcesSchema),
  asyncHandler(readResource),
)

export default router
