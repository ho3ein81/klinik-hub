import { Router } from 'express'
import {
  findAll,
  findOne,
  update,
  remove,
  create,
  activate,
  deactivate,
} from './specialty.controller'
import {
  updateSpecialtySchema,
  specialtyIdSchema,
  createSpecialtySchema,
  listSpecialtiesSchema,
} from './specialty.validation'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'
import { clinicUserAuthentication } from '../../middleware/clinicUserAuthentication'

const router = Router()

router.use(clinicUserAuthentication)

router.post('/', validate(createSpecialtySchema), asyncHandler(create))
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
