import { Notification } from '@prisma/client'
import { NotificationResponseDto } from './notification.dto'

export function toNotificationResponseDto(
  notification: Notification,
): NotificationResponseDto {
  return {
    id: notification.id,
    clinicId: notification.clinicId,
    patientId: notification.patientId,
    clinicUserId: notification.clinicUserId,
    appointmentId: notification.appointmentId,
    type: notification.type,
    recipient: notification.recipient,
    subject: notification.subject,
    content: notification.content,
    status: notification.status,
    errorMessage: notification.errorMessage,
    sentAt: notification.sentAt,
    createdAt: notification.createdAt,
    updatedAt: notification.updatedAt,
  }
}
