import { Prisma, Service } from '@prisma/client'
import prisma from '../../db/prisma'
import { BaseRepository } from '../../db/base.repository'

export class ServiceRepository extends BaseRepository<
  Service,
  Prisma.ServiceWhereInput,
  Prisma.ServiceWhereUniqueInput,
  Prisma.ServiceOrderByWithRelationInput,
  Prisma.ServiceUncheckedCreateInput,
  Prisma.ServiceUncheckedUpdateInput
> {
  constructor() {
    super(prisma, 'service')
  }
}

export const serviceRepository = new ServiceRepository()
