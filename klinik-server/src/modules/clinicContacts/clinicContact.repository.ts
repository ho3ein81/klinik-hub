import { Prisma, ClinicContact } from '@prisma/client'
import prisma from '../../db/prisma'
import { BaseRepository } from '../../db/base.repository'

export class ClinicContactRepository extends BaseRepository<
  ClinicContact,
  Prisma.ClinicContactWhereInput,
  Prisma.ClinicContactWhereUniqueInput,
  Prisma.ClinicContactOrderByWithRelationInput,
  Prisma.ClinicContactUncheckedCreateInput,
  Prisma.ClinicContactUncheckedUpdateInput
> {
  constructor() {
    super(prisma, 'clinicContact')
  }
}

export const clinicContactRepository = new ClinicContactRepository()
