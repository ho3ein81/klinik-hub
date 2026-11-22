import { Prisma, AdminUser } from '@prisma/client'
import prisma from '../../db/prisma'
import { BaseRepository } from '../../db/base.repository'

export class AdminUserRepository extends BaseRepository<
  AdminUser,
  Prisma.AdminUserWhereInput,
  Prisma.AdminUserWhereUniqueInput,
  Prisma.AdminUserOrderByWithRelationInput,
  Prisma.AdminUserUncheckedCreateInput,
  Prisma.AdminUserUncheckedUpdateInput
> {
  constructor() {
    super(prisma, 'adminUser')
  }
}

export const adminUserRepository = new AdminUserRepository()
