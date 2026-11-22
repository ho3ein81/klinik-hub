import { Router } from 'express'
import {
  archive,
  create,
  findAll,
  findOne,
  publish,
  readResource,
  remove,
  update,
} from './article.controller'
import {
  articleIdSchema,
  articleReadResourcesSchema,
  createArticleSchema,
  listArticlesSchema,
  updateArticleSchema,
} from './article.validation'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'
import { clinicUserAuthentication } from '../../middleware/clinicUserAuthentication'
import { requireClinicAdmin } from '../../middleware/requireClinicAdmin'
import { uploadImage } from '../../middleware/upload'

const router = Router()

router.use(clinicUserAuthentication)

// Any clinic user (ADMIN, DOCTOR, NURSE, RECEPTIONIST) may create/manage articles.
router.post(
  '/',
  uploadImage({
    fieldName: 'image',
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    sizes: ['m'],
  }),
  validate(createArticleSchema),
  asyncHandler(create),
)
router.get('/', validate(listArticlesSchema), asyncHandler(findAll))
router.get('/:id', validate(articleIdSchema), asyncHandler(findOne))
router.patch(
  '/:id',
  uploadImage({
    fieldName: 'image',
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    sizes: ['m'],
  }),
  validate(updateArticleSchema),
  asyncHandler(update),
)
router.delete('/:id', validate(articleIdSchema), asyncHandler(remove))

// Only an ADMIN-type clinic user may publish or archive an article.
router.patch(
  '/:id/publish',
  requireClinicAdmin,
  validate(articleIdSchema),
  asyncHandler(publish),
)
router.patch(
  '/:id/archive',
  requireClinicAdmin,
  validate(articleIdSchema),
  asyncHandler(archive),
)

router.get(
  '/read-resources/:resourceField/:resourceValue',
  validate(articleReadResourcesSchema),
  asyncHandler(readResource),
)

export default router
