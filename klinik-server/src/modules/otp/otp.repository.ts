import { Prisma, Otp } from '@prisma/client'
import prisma from '../../db/prisma'
import { BaseRepository } from '../../db/base.repository'

export class OtpRepository extends BaseRepository<
  Otp,
  Prisma.OtpWhereInput,
  Prisma.OtpWhereUniqueInput,
  Prisma.OtpOrderByWithRelationInput,
  Prisma.OtpUncheckedCreateInput,
  Prisma.OtpUncheckedUpdateInput
> {
  constructor() {
    super(prisma, 'otp')
  }
}

export const otpRepository = new OtpRepository()
