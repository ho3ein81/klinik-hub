import { Prisma, Appointment } from '@prisma/client'
import prisma from '../../db/prisma'
import { BaseRepository } from '../../db/base.repository'

export type FullAppointment = Prisma.AppointmentGetPayload<{
  include: { patient: true; doctor: true }
}>

export class AppointmentRepository extends BaseRepository<
  Appointment,
  Prisma.AppointmentWhereInput,
  Prisma.AppointmentWhereUniqueInput,
  Prisma.AppointmentOrderByWithRelationInput,
  Prisma.AppointmentUncheckedCreateInput,
  Prisma.AppointmentUncheckedUpdateInput
> {
  constructor() {
    super(prisma, 'appointment')
  }
}

export const appointmentRepository = new AppointmentRepository()
