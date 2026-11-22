import { DoctorBlockedTime, Prisma } from '@prisma/client'
import prisma from '../../db/prisma'
import { BaseRepository } from '../../db/base.repository'

export type FullDoctorBlockedTime = Prisma.DoctorBlockedTimeGetPayload<{
  include: { doctor: true }
}>

export class DoctorBlockedTimeRepository extends BaseRepository<
  DoctorBlockedTime,
  Prisma.DoctorBlockedTimeWhereInput,
  Prisma.DoctorBlockedTimeWhereUniqueInput,
  Prisma.DoctorBlockedTimeOrderByWithRelationInput,
  Prisma.DoctorBlockedTimeUncheckedCreateInput,
  Prisma.DoctorBlockedTimeUncheckedUpdateInput
> {
  constructor() {
    super(prisma, 'doctorBlockedTime')
  }

  /** Blocked-time rows for a doctor that overlap [startDate, endDate). */
  async findOverlapping(params: {
    doctorId: string
    startDate: Date
    endDate: Date
    excludeId?: string
  }): Promise<DoctorBlockedTime[]> {
    const { data: doctorBlockedTimes } = await this.findAll({
      where: {
        doctorId: params.doctorId,
        ...(params.excludeId && { id: { not: params.excludeId } }),
        startDate: { lt: params.endDate },
        endDate: { gt: params.startDate },
      },
    })
    return doctorBlockedTimes
  }
}

export const doctorBlockedTimeRepository = new DoctorBlockedTimeRepository()
