import { Prisma, Patient } from '@prisma/client'
import prisma from '../../db/prisma'
import { BaseRepository } from '../../db/base.repository'

export class PatientRepository extends BaseRepository<
  Patient,
  Prisma.PatientWhereInput,
  Prisma.PatientWhereUniqueInput,
  Prisma.PatientOrderByWithRelationInput,
  Prisma.PatientUncheckedCreateInput,
  Prisma.PatientUncheckedUpdateInput
> {
  constructor() {
    super(prisma, 'patient')
  }
}

export const patientRepository = new PatientRepository()
