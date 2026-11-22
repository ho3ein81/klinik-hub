import { ClinicSetting, Prisma } from '@prisma/client'
import prisma from '../../db/prisma'
import { BaseRepository } from '../../db/base.repository'

export class ClinicSettingRepository extends BaseRepository<
  ClinicSetting,
  Prisma.ClinicSettingWhereInput,
  Prisma.ClinicSettingWhereUniqueInput,
  Prisma.ClinicSettingOrderByWithRelationInput,
  Prisma.ClinicSettingUncheckedCreateInput,
  Prisma.ClinicSettingUncheckedUpdateInput
> {
  constructor() {
    super(prisma, 'clinicSetting')
  }

  async findByClinicId(clinicId: string): Promise<ClinicSetting | null> {
    return this.findOne({ clinicId })
  }
}

export const clinicSettingRepository = new ClinicSettingRepository()
