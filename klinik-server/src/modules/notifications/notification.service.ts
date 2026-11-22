import i18next from 'i18next'
import { NotificationStatus, NotificationType } from '@prisma/client'
import { logger } from '../../utils/logger'
import { smsProvider } from '../../providers/sms.provider'
import { notificationRepository } from './notification.repository'
import {
  CreateNotificationDto,
  NotificationResponseDto,
} from './notification.dto'
import { toNotificationResponseDto } from './notification.mapper'

export async function sendNotification(
  dto: CreateNotificationDto,
): Promise<NotificationResponseDto> {
  let status: NotificationStatus = NotificationStatus.SENT
  let errorMessage: string | undefined = undefined
  let sentAt: Date | undefined = new Date()

  try {
    if (dto.type === NotificationType.SMS) {
      await smsProvider.sendSms({
        to: dto.recipient,
        message: dto.content,
      })
    } else if (dto.type === NotificationType.EMAIL) {
      logger.info(
        `[EMAIL SENT] To: ${dto.recipient} | Subject: ${dto.subject} | Content: ${dto.content}`,
      )
    }
  } catch (error: any) {
    status = NotificationStatus.FAILED
    errorMessage = error?.message || 'Failed to send notification'
    sentAt = undefined
    logger.error(
      `Notification delivery failed for recipient ${dto.recipient}:`,
      error,
    )
  }

  const notification = await notificationRepository.create({
    clinicId: dto.clinicId,
    patientId: dto.patientId,
    clinicUserId: dto.clinicUserId,
    appointmentId: dto.appointmentId,
    type: dto.type,
    recipient: dto.recipient,
    subject: dto.subject,
    content: dto.content,
    status,
    errorMessage,
    sentAt,
  })

  return toNotificationResponseDto(notification)
}

export async function notifyAppointmentBooked(params: {
  appointmentId: string
  clinicId: string
  patientId: string
  patientPhone: string
  patientName: string
  doctorId: string
  doctorPhone?: string | null
  doctorName: string
  date: Date
  startTime: string
  lang?: string
}): Promise<void> {
  const lang = params.lang || 'en'
  const formattedDate = params.date.toISOString().split('T')[0]

  // 1. Notify Patient
  const patientContent = i18next.t('notifications.appointmentBookedPatient', {
    lng: lang,
    patientName: params.patientName,
    date: formattedDate,
    time: params.startTime,
  })

  await sendNotification({
    clinicId: params.clinicId,
    patientId: params.patientId,
    appointmentId: params.appointmentId,
    type: NotificationType.SMS,
    recipient: params.patientPhone,
    content: patientContent,
  })

  // 2. Notify Doctor
  if (params.doctorPhone) {
    const doctorContent = i18next.t('notifications.appointmentBookedDoctor', {
      lng: lang,
      doctorName: params.doctorName,
      patientName: params.patientName,
      date: formattedDate,
      time: params.startTime,
    })

    await sendNotification({
      clinicId: params.clinicId,
      clinicUserId: params.doctorId,
      appointmentId: params.appointmentId,
      type: NotificationType.SMS,
      recipient: params.doctorPhone,
      content: doctorContent,
    })
  }
}

export async function notifyAppointmentRejected(params: {
  appointmentId: string
  clinicId: string
  patientId: string
  patientPhone: string
  patientName: string
  date: Date
  startTime: string
  lang?: string
}): Promise<void> {
  const lang = params.lang || 'en'
  const formattedDate = params.date.toISOString().split('T')[0]

  const content = i18next.t('notifications.appointmentRejectedPatient', {
    lng: lang,
    patientName: params.patientName,
    date: formattedDate,
    time: params.startTime,
  })

  await sendNotification({
    clinicId: params.clinicId,
    patientId: params.patientId,
    appointmentId: params.appointmentId,
    type: NotificationType.SMS,
    recipient: params.patientPhone,
    content,
  })
}
