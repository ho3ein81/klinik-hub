import { api } from '@/lib/api-client'
import { API_ENDPOINTS, CLINIC_ID } from '@/config/api.config'
import type { ApiPaginated, ApiSuccess } from '@/types/api'
import type { Appointment, AppointmentStatus } from '@/types/domain'

// --- Anonymous booking (not logged in yet) ---

export async function requestBookingOtp(phone: string): Promise<void> {
  await api.post(
    API_ENDPOINTS.appointments.anonymousRequestOtp,
    { phone },
    { skipAuth: true },
  )
}

export interface BookAnonymousInput {
  phone: string
  code: string
  firstName: string
  lastName: string
  dateOfBirth?: string
  doctorId: string
  subject?: string
  description?: string
  date: string
  startTime: string
  endTime: string
}

export async function bookAppointmentAnonymous(
  input: BookAnonymousInput,
): Promise<Appointment> {
  const res = await api.post<ApiSuccess<Appointment>>(
    API_ENDPOINTS.appointments.bookAnonymous,
    { ...input, clinicId: CLINIC_ID },
    { skipAuth: true },
  )
  return res.data
}

// --- Logged-in patient self-service ---

export interface BookAsPatientInput {
  doctorId: string
  subject?: string
  description?: string
  date: string
  startTime: string
  endTime: string
}

export async function bookAppointmentAsPatient(
  input: BookAsPatientInput,
): Promise<Appointment> {
  const res = await api.post<ApiSuccess<Appointment>>(
    API_ENDPOINTS.appointments.list,
    input,
  )
  return res.data
}

export function listMyAppointments(params: {
  page?: number
  limit?: number
  status?: AppointmentStatus
} = {}) {
  return api.get<ApiPaginated<Appointment>>(API_ENDPOINTS.appointments.list, {
    params,
  })
}

export async function getMyAppointment(id: string): Promise<Appointment> {
  const res = await api.get<ApiSuccess<Appointment>>(API_ENDPOINTS.appointments.byId(id))
  return res.data
}

export async function cancelAppointment(id: string, reason?: string): Promise<Appointment> {
  const res = await api.patch<ApiSuccess<Appointment>>(
    API_ENDPOINTS.appointments.cancel(id),
    reason ? { reason } : undefined,
  )
  return res.data
}

export interface RescheduleInput {
  date: string
  startTime: string
  endTime: string
}

export async function rescheduleAppointment(
  id: string,
  input: RescheduleInput,
): Promise<Appointment> {
  const res = await api.patch<ApiSuccess<Appointment>>(
    API_ENDPOINTS.appointments.reschedule(id),
    input,
  )
  return res.data
}
