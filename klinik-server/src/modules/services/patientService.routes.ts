import { Router } from 'express'
import {
  findAllPublic,
  findOne,
  findOnePublic,
  readResource,
} from './service.controller'
import {
  listPublicServicesSchema,
  serviceIdSchema,
  serviceReadResourcesSchema,
} from './service.validation'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'

const router = Router()

router.get('/', validate(listPublicServicesSchema), asyncHandler(findAllPublic))
router.get('/:id', validate(serviceIdSchema), asyncHandler(findOne))

router.get(
  '/read-resources/:resourceField/:resourceValue',
  validate(serviceReadResourcesSchema),
  asyncHandler(readResource),
)

router.get('/:id', validate(serviceIdSchema), asyncHandler(findOnePublic))

export default router
