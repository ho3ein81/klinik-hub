import { Prisma, Specialty } from '@prisma/client'
import prisma from '../../db/prisma'
import { BaseRepository } from '../../db/base.repository'

export class SpecialtyRepository extends BaseRepository<
  Specialty,
  Prisma.SpecialtyWhereInput,
  Prisma.SpecialtyWhereUniqueInput,
  Prisma.SpecialtyOrderByWithRelationInput,
  Prisma.SpecialtyUncheckedCreateInput,
  Prisma.SpecialtyUncheckedUpdateInput
> {
  constructor() {
    super(prisma, 'specialty')
  }
}

export const specialtyRepository = new SpecialtyRepository()
