import { Router } from 'express'
import {
  create,
  findAll,
  findOne,
  update,
  remove,
  readResource,
  activate,
  deactivate,
} from './clinicUser.controller'
import {
  createAdminClinicUserSchema,
  updateClinicUserSchema,
  clinicUserIdSchema,
  clinicUserReadResourcesSchema,
  listUsersSchema,
} from './clinicUser.validation'
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
  validate(createAdminClinicUserSchema),
  asyncHandler(create),
)
router.get('/', validate(listUsersSchema), asyncHandler(findAll))
router.get('/:id', validate(clinicUserIdSchema), asyncHandler(findOne))
router.patch(
  '/:id',
  uploadImage({
    fieldName: 'avatar',
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    sizes: ['t', 'm'],
  }),
  validate(updateClinicUserSchema),
  asyncHandler(update),
)
router.delete('/:id', validate(clinicUserIdSchema), asyncHandler(remove))

router.get(
  '/read-resources/:resourceField/:resourceValue',
  validate(clinicUserReadResourcesSchema),
  asyncHandler(readResource),
)

router.patch('/:id/activate', asyncHandler(activate))

router.patch('/:id/deactivate', asyncHandler(deactivate))

export default router
