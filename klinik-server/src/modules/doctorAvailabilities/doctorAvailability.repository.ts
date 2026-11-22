import { DayOfWeek, DoctorAvailability, Prisma } from '@prisma/client'
import prisma from '../../db/prisma'
import { BaseRepository } from '../../db/base.repository'
import { FindOverlappingDto } from './doctorAvailability.dto'

export type FullDoctorAvailability = Prisma.DoctorAvailabilityGetPayload<{
  include: { doctor: true }
}>

export class DoctorAvailabilityRepository extends BaseRepository<
  DoctorAvailability,
  Prisma.DoctorAvailabilityWhereInput,
  Prisma.DoctorAvailabilityWhereUniqueInput,
  Prisma.DoctorAvailabilityOrderByWithRelationInput,
  Prisma.DoctorAvailabilityUncheckedCreateInput,
  Prisma.DoctorAvailabilityUncheckedUpdateInput
> {
  constructor() {
    super(prisma, 'doctorAvailability')
  }

  async findOverlapping(
    params: FindOverlappingDto,
  ): Promise<DoctorAvailability | null> {
    return await this.findFirst(
      {
        clinicId: params.clinicId,
        doctorId: params.doctorId,
        dayOfWeek: params.dayOfWeek,
        isActive: true,
        ...(params.excludeId && { id: { not: params.excludeId } }),
        startTime: { lt: params.endTime },
        endTime: { gt: params.startTime },
      },
      { orderBy: { startTime: 'asc' } },
    )
  }
}

export const doctorAvailabilityRepository = new DoctorAvailabilityRepository()
