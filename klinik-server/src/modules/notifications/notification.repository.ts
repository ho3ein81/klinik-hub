import { Notification, Prisma } from '@prisma/client'
import { BaseRepository } from '../../db/base.repository'
import prisma from '../../db/prisma'

export class NotificationRepository extends BaseRepository<
  Notification,
  Prisma.NotificationWhereInput,
  Prisma.NotificationWhereUniqueInput,
  Prisma.NotificationOrderByWithRelationInput,
  Prisma.NotificationUncheckedCreateInput,
  Prisma.NotificationUncheckedUpdateInput
> {
  constructor() {
    super(prisma, 'notification')
  }
}

export const notificationRepository = new NotificationRepository()
