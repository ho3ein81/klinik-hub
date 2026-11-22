// Domain entities for the "clinic" portal — mirrors klinik-server's Prisma models.

export type ClinicUserType = 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST'

export interface ClinicUser {
  id: string
  clinicId: string
  email: string
  phone: string | null
  isActive: boolean
  type: ClinicUserType
  avatar: string | null
  firstName: string
  lastName: string
  specialties: Specialty[]
  createdAt: string
  updatedAt: string
}

export interface Clinic {
  id: string
  name: string
  description: string | null
  address: string | null
  image: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ClinicSetting {
  id: string
  clinicId: string
  allowPatientBooking: boolean
  showArticle: boolean
  createdAt: string
  updatedAt: string
}

export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface Article {
  id: string
  clinicId: string
  title: string
  content: string
  image: string | null
  status: ArticleStatus
  createdAt: string
  updatedAt: string
}

export type ContactType = 'EMAIL' | 'PHONE'

export interface ClinicContact {
  id: string
  clinicId: string
  name: string
  contactType: ContactType
  value: string
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}

export interface Patient {
  id: string
  clinicId: string
  firstName: string
  lastName: string
  phone: string
  address: string | null
  dateOfBirth: string | null
  avatar: string | null
  createdAt: string
  updatedAt: string
}

export interface Service {
  id: string
  clinicId: string
  name: string
  description: string | null
  price: number | null
  duration: number | null
  image: string | null
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface Specialty {
  id: string
  clinicId: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export interface DoctorAvailability {
  id: string
  clinicId: string
  doctorId: string
  doctorFirstName?: string
  doctorLastName?: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  durationSlot: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AvailableSlot {
  date: string
  startTime: string
  endTime: string
  doctorId: string
}

export interface DoctorBlockedTime {
  id: string
  clinicId: string
  doctorId: string
  doctorFirstName?: string
  doctorLastName?: string
  startDate: string
  endDate: string
  reason: string | null
  createdAt: string
  updatedAt: string
}

export type AppointmentStatus =
  | 'BOOKED'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'NOT_SHOW'
  | 'CANCELLED'

export interface Appointment {
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
  date: string
  startTime: string
  endTime: string
  createdAt: string
  updatedAt: string
  cancelledAt: string | null
  cancellationReason: string | null
  rejectedAt: string | null
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
