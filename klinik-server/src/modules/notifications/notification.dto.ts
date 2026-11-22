import { NotificationStatus, NotificationType } from '@prisma/client'

export interface NotificationResponseDto {
  id: string
  clinicId?: string | null
  patientId?: string | null
  clinicUserId?: string | null
  appointmentId?: string | null
  type: NotificationType
  recipient: string
  subject?: string | null
  content: string
  status: NotificationStatus
  errorMessage?: string | null
  sentAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateNotificationDto {
  clinicId?: string
  patientId?: string
  clinicUserId?: string
  appointmentId?: string
  type: NotificationType
  recipient: string
  subject?: string
  content: string
  status?: NotificationStatus
  errorMessage?: string
  sentAt?: Date
}
