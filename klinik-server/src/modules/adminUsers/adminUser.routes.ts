import { Router } from 'express'
import {
  create,
  findAll,
  findOne,
  update,
  remove,
  me,
  login,
  activate,
  deactivate,
} from './adminUser.controller'

import {
  createAdminUserSchema,
  updateAdminUserSchema,
  adminUserIdSchema,
  loginAdminUserSchema,
  listAdminUsersSchema,
} from './adminUser.validation'

import { validate } from '../../middleware/validate'
import { asyncHandler } from '../../middleware/asyncHandler'
import { adminUserAuthentication } from '../../middleware/adminUserAuthentication'

const router = Router()

router.post('/login', validate(loginAdminUserSchema), asyncHandler(login))
router.use(adminUserAuthentication)
router.get('/me', asyncHandler(me))
router.post('/', validate(createAdminUserSchema), asyncHandler(create))
router.get('/', validate(listAdminUsersSchema), asyncHandler(findAll))
router.get('/:id', validate(adminUserIdSchema), asyncHandler(findOne))
router.patch('/:id', validate(updateAdminUserSchema), asyncHandler(update))
router.delete('/:id', validate(adminUserIdSchema), asyncHandler(remove))
router.patch('/:id/activate', asyncHandler(activate))
router.patch('/:id/deactivate', asyncHandler(deactivate))

export default router
