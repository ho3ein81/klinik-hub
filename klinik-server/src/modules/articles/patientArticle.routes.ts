import { Router } from 'express'
import {
  findAllPublic,
  findOnePublic,
  readResource,
} from './article.controller'
import {
  articleIdSchema,
  articleReadResourcesSchema,
  listPublicArticlesSchema,
} from './article.validation'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'

const router = Router()

router.get('/', validate(listPublicArticlesSchema), asyncHandler(findAllPublic))
router.get('/:id', validate(articleIdSchema), asyncHandler(findOnePublic))

router.get(
  '/read-resources/:resourceField/:resourceValue',
  validate(articleReadResourcesSchema),
  asyncHandler(readResource),
)

router.get('/:id', validate(articleIdSchema), asyncHandler(findOnePublic))

export default router
