import { AppointmentCreatedByType, AppointmentStatus } from '@prisma/client'
import { AppointmentResponseDto } from './appointment.dto'

export function toAppointmentResponseDto(appointment: {
  id: string
  clinicId: string
  doctorId: string
  patientId: string
  subject: string | null
  description: string | null
  status: AppointmentStatus
  createdByType: AppointmentCreatedByType
  date: Date
  startTime: string
  endTime: string
  createdAt: Date
  updatedAt: Date
  cancelledAt?: Date | null
  cancellationReason?: string | null
  rejectedAt?: Date | null
  rejectionReason?: string | null
  // Present only when the query used `include: { doctor: true, patient: true }`.
  doctor?: { firstName: string; lastName: string } | null
  patient?: { firstName: string; lastName: string } | null
}): AppointmentResponseDto {
  return {
    id: appointment.id,
    clinicId: appointment.clinicId,
    doctorId: appointment.doctorId,
    doctorFirstName: appointment.doctor?.firstName,
    doctorLastName: appointment.doctor?.lastName,
    patientId: appointment.patientId,
    patientFirstName: appointment.patient?.firstName,
    patientLastName: appointment.patient?.lastName,
    subject: appointment.subject,
    description: appointment.description,
    status: appointment.status,
    createdByType: appointment.createdByType,
    date: appointment.date,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
    cancelledAt: appointment.cancelledAt ?? null,
    cancellationReason: appointment.cancellationReason ?? null,
    rejectedAt: appointment.rejectedAt ?? null,
    rejectionReason: appointment.rejectionReason ?? null,
  }
}
