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
  createAdminArticleSchema,
  listArticlesSchema,
  updateArticleSchema,
} from './article.validation'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'
import { adminUserAuthentication } from '../../middleware/adminUserAuthentication'
import { uploadImage } from '../../middleware/upload'

const router = Router()

router.use(adminUserAuthentication)

router.post(
  '/',
  uploadImage({
    fieldName: 'image',
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
    sizes: ['m'],
  }),
  validate(createAdminArticleSchema),
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

// Any authenticated admin user may publish or archive an article.
router.patch('/:id/publish', validate(articleIdSchema), asyncHandler(publish))
router.patch('/:id/archive', validate(articleIdSchema), asyncHandler(archive))

router.get(
  '/read-resources/:resourceField/:resourceValue',
  validate(articleReadResourcesSchema),
  asyncHandler(readResource),
)

export default router
