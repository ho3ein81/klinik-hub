import { Prisma, Clinic } from '@prisma/client'
import prisma from '../../db/prisma'
import { BaseRepository } from '../../db/base.repository'

export class ClinicRepository extends BaseRepository<
  Clinic,
  Prisma.ClinicWhereInput,
  Prisma.ClinicWhereUniqueInput,
  Prisma.ClinicOrderByWithRelationInput,
  Prisma.ClinicUncheckedCreateInput,
  Prisma.ClinicUncheckedUpdateInput
> {
  constructor() {
    super(prisma, 'clinic')
  }
}

export const clinicRepository = new ClinicRepository()
