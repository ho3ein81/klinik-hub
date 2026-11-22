import { Router } from 'express'
import {
  create,
  findAll,
  findOne,
  update,
  remove,
  activate,
  deactivate,
} from './specialty.controller'
import {
  updateSpecialtySchema,
  specialtyIdSchema,
  createAdminSpecialtySchema,
  listSpecialtiesSchema,
} from './specialty.validation'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'
import { adminUserAuthentication } from '../../middleware/adminUserAuthentication'

const router = Router()

router.use(adminUserAuthentication)

router.post('/', validate(createAdminSpecialtySchema), asyncHandler(create))
router.get('/', validate(listSpecialtiesSchema), asyncHandler(findAll))
router.get('/:id', validate(specialtyIdSchema), asyncHandler(findOne))
router.patch('/:id', validate(updateSpecialtySchema), asyncHandler(update))
router.delete('/:id', validate(specialtyIdSchema), asyncHandler(remove))

router.patch('/:id/activate', validate(specialtyIdSchema), asyncHandler(activate))

router.patch(
  '/:id/deactivate',
  validate(specialtyIdSchema),
  asyncHandler(deactivate),
)

export default router
