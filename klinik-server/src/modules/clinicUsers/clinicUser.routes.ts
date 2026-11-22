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
  login,
  me,
  readResource,
  changePassword,
  refreshToken,
  activate,
  deactivate,
} from './clinicUser.controller'
import {
  loginClinicUserSchema,
  createClinicUserSchema,
  updateClinicUserSchema,
  clinicUserIdSchema,
  clinicUserReadResourcesSchema,
  listUsersSchema,
  refreshTokenSchema,
  changeClinicUserPasswordSchema,
} from './clinicUser.validation'
import { uploadImage } from '../../middleware/upload'
import {
  requireClinicAdmin,
  requireClinicAdminOrSelf,
} from '../../middleware/requireClinicAdmin'

const router = Router()

router.post('/login', validate(loginClinicUserSchema), asyncHandler(login))
router.post(
  '/refresh-token',
  validate(refreshTokenSchema),
  asyncHandler(refreshToken),
)

router.use(clinicUserAuthentication)
router.get('/me', clinicUserAuthentication, asyncHandler(me))
router.post(
  '/change-password',
  validate(changeClinicUserPasswordSchema),
  asyncHandler(changePassword),
)

router.post(
  '/',
  requireClinicAdmin,
  uploadImage({
    fieldName: 'avatar',
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    sizes: ['t', 'm'],
  }),
  validate(createClinicUserSchema),
  asyncHandler(create),
)
router.get('/', validate(listUsersSchema), asyncHandler(findAll))
router.get('/:id', validate(clinicUserIdSchema), asyncHandler(findOne))
router.patch(
  '/:id',
  requireClinicAdminOrSelf,
  uploadImage({
    fieldName: 'avatar',
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    sizes: ['t', 'm'],
  }),
  validate(updateClinicUserSchema),
  asyncHandler(update),
)
router.delete(
  '/:id',
  requireClinicAdmin,
  validate(clinicUserIdSchema),
  asyncHandler(remove),
)

router.get(
  '/read-resources/:resourceField/:resourceValue',
  validate(clinicUserReadResourcesSchema),
  asyncHandler(readResource),
)

router.patch('/:id/activate', requireClinicAdmin, asyncHandler(activate))

router.patch(
  '/:id/deactivate',
  requireClinicAdminOrSelf,
  asyncHandler(deactivate),
)

export default router
