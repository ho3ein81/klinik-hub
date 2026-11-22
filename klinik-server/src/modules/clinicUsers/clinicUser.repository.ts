import { Prisma, ClinicUser } from '@prisma/client'
import prisma from '../../db/prisma'
import { BaseRepository } from '../../db/base.repository'

export type ClinicUserWithSpecialties = Prisma.ClinicUserGetPayload<{
  include: { specialties: true }
}>

export class ClinicUserRepository extends BaseRepository<
  ClinicUser,
  Prisma.ClinicUserWhereInput,
  Prisma.ClinicUserWhereUniqueInput,
  Prisma.ClinicUserOrderByWithRelationInput,
  Prisma.ClinicUserUncheckedCreateInput,
  Prisma.ClinicUserUncheckedUpdateInput
> {
  constructor() {
    super(prisma, 'clinicUser')
  }
}

export const clinicUserRepository = new ClinicUserRepository()
