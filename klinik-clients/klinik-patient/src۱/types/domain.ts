// Domain entities for the patient portal — mirrors klinik-server's Prisma
// models, scoped to what the /api/v1/patient/* routes expose.

export interface Specialty {
  id: string
  clinicId: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type ClinicUserRole = 'DOCTOR' | 'NURSE' | 'RECEPTIONIST'

// The public doctor/staff listings deliberately omit email/phone (see
// clinicUser.dto.ts#PublicDoctorResponseDto on the backend). Admins are
// never exposed through either endpoint.
export interface Doctor {
  id: string
  firstName: string
  lastName: string
  avatar: string | null
  type: ClinicUserRole
  specialties: Specialty[]
}

export type StaffMember = Doctor

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

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export interface AvailableSlot {
  date: string
  startTime: string
  endTime: string
  doctorId: string
}

export interface DoctorAvailability {
  id: string
  doctorId: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  isActive: boolean
}

export interface ClinicSetting {
  clinicId: string
  allowPatientBooking: boolean
  showArticle: boolean
}

export interface Article {
  id: string
  clinicId: string
  title: string
  content: string
  image: string | null
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
}
