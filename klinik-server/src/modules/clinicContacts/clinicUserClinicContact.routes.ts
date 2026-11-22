import { Router } from 'express'
import {
  findAll,
  findOne,
  update,
  remove,
  create,
} from './clinicContact.controller'
import {
  updateClinicContactSchema,
  clinicContactIdSchema,
  createClinicContactSchema,
  listClinicContactsSchema,
} from './clinicContact.validation'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'
import { clinicUserAuthentication } from '../../middleware/clinicUserAuthentication'

const router = Router()

router.use(clinicUserAuthentication)

router.post('/', validate(createClinicContactSchema), asyncHandler(create))
router.get('/', validate(listClinicContactsSchema), asyncHandler(findAll))
router.get('/:id', validate(clinicContactIdSchema), asyncHandler(findOne))
router.patch('/:id', validate(updateClinicContactSchema), asyncHandler(update))
router.delete('/:id', validate(clinicContactIdSchema), asyncHandler(remove))

export default router
