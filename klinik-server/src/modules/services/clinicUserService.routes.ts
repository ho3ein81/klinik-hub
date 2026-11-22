import { Router } from 'express'
import {
  findAll,
  findOne,
  update,
  remove,
  create,
  activate,
  deactivate,
  readResource,
} from './service.controller'
import {
  updateServiceSchema,
  serviceIdSchema,
  createServiceSchema,
  listServicesSchema,
  serviceReadResourcesSchema,
} from './service.validation'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'
import { clinicUserAuthentication } from '../../middleware/clinicUserAuthentication'
import { uploadImage } from '../../middleware/upload'

const router = Router()

router.use(clinicUserAuthentication)

router.post(
  '/',
  uploadImage({
    fieldName: 'image',
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    sizes: ['m'],
  }),
  validate(createServiceSchema),
  asyncHandler(create),
)
router.get('/', validate(listServicesSchema), asyncHandler(findAll))
router.get('/:id', validate(serviceIdSchema), asyncHandler(findOne))
router.patch(
  '/:id',
  uploadImage({
    fieldName: 'image',
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    sizes: ['m'],
  }),
  validate(updateServiceSchema),
  asyncHandler(update),
)
router.delete('/:id', validate(serviceIdSchema), asyncHandler(remove))

router.patch('/:id/activate', asyncHandler(activate))

router.patch('/:id/deactivate', asyncHandler(deactivate))

router.get(
  '/read-resources/:resourceField/:resourceValue',
  validate(serviceReadResourcesSchema),
  asyncHandler(readResource),
)

export default router
