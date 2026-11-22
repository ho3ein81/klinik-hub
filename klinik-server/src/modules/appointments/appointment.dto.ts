import { AppointmentCreatedByType, AppointmentStatus } from '@prisma/client'
import { PaginationParams } from '../../types/pagination'

export interface RequestAppointmentOtpRequestDto {
  phone: string
}

export interface BookAppointmentAnonymousRequestDto {
  phone: string
  code: string
  firstName: string
  lastName: string
  dateOfBirth?: Date | string
  clinicId: string
  doctorId: string
  subject?: string
  description?: string
  date: Date | string
  startTime: string
  endTime: string
}

export interface BookAppointmentAsPatientRequestDto {
  doctorId: string
  subject?: string
  description?: string
  date: Date | string
  startTime: string
  endTime: string
}

export interface CreateAppointmentByStaffRequestDto {
  clinicId?: string // required only when the actor is an admin (not clinic-scoped)
  patientId?: string
  firstName?: string
  lastName?: string
  phone?: string
  dateOfBirth?: Date | string
  doctorId: string
  subject?: string
  description?: string
  date: Date | string
  startTime: string
  endTime: string
}

export interface AppointmentResponseDto {
  id: string
  clinicId: string
  doctorId: string
  doctorFirstName?: string
  doctorLastName?: string
  patientId: string
  patientFirstName?: string
  patientLastName?: string
  subject: string | null
  description: string | null
  status: AppointmentStatus
  createdByType: AppointmentCreatedByType
  date: Date
  startTime: string
  endTime: string
  createdAt: Date
  updatedAt: Date
  cancelledAt: Date | null
  cancellationReason: string | null
  rejectedAt: Date | null
  rejectionReason: string | null
}

export interface AppointmentStatusCounts {
  total: number
  booked: number
  approved: number
  completed: number
  cancelled: number
  rejected: number
  notShow: number
}

export interface TransitionAppointmentStatusDto {
  id: string
  toStatus: AppointmentStatus
  authenticatedClinicId?: string
  restrictToPatientId?: string
  reason?: string
}

export interface GetAppointmentsParamsDto extends PaginationParams {
  authenticatedClinicId?: string
  clinicId?: string
  doctorId?: string
  patientId?: string
  status?: AppointmentStatus
  date?: Date
}

export interface GetExistingAppointmentsDto {
  doctorId: string
  date: Date
  excludeAppointmentId?: string
}

export interface RescheduleAppointmentRequestDto {
  date: Date | string
  startTime: string
  endTime: string
}

export interface AppointmentStatusCountsDto {
  from: Date
  to: Date
  clinicId?: string
}
