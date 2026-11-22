import { Router } from 'express'
import {
  create,
  findAll,
  findOne,
  update,
  remove,
} from './clinicContact.controller'
import {
  updateClinicContactSchema,
  clinicContactIdSchema,
  createAdminClinicContactSchema,
  listClinicContactsSchema,
} from './clinicContact.validation'
import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'
import { adminUserAuthentication } from '../../middleware/adminUserAuthentication'

const router = Router()

router.use(adminUserAuthentication)

router.post('/', validate(createAdminClinicContactSchema), asyncHandler(create))
router.get('/', validate(listClinicContactsSchema), asyncHandler(findAll))
router.get('/:id', validate(clinicContactIdSchema), asyncHandler(findOne))
router.patch('/:id', validate(updateClinicContactSchema), asyncHandler(update))
router.delete('/:id', validate(clinicContactIdSchema), asyncHandler(remove))

export default router
