import { api } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api.config'
import type { ApiPaginated, ApiSuccess, ListQuery } from '@/types/api'
import type { AvailableSlot, DayOfWeek, DoctorAvailability } from '@/types/domain'

export interface DoctorAvailabilityInput {
  doctorId: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  durationSlot?: number
}

export function listDoctorAvailabilities(
  params: ListQuery & { doctorId?: string },
) {
  return api.get<ApiPaginated<DoctorAvailability>>(
    API_ENDPOINTS.doctorAvailabilities.list,
    {
      params,
    },
  )
}

export async function createDoctorAvailability(
  input: DoctorAvailabilityInput,
): Promise<DoctorAvailability> {
  const res = await api.post<ApiSuccess<DoctorAvailability>>(
    API_ENDPOINTS.doctorAvailabilities.list,
    input,
  )
  return res.data
}

export async function updateDoctorAvailability(
  id: string,
  input: Partial<Omit<DoctorAvailabilityInput, 'doctorId'>>,
): Promise<DoctorAvailability> {
  const res = await api.patch<ApiSuccess<DoctorAvailability>>(
    API_ENDPOINTS.doctorAvailabilities.byId(id),
    input,
  )
  return res.data
}

export async function deleteDoctorAvailability(id: string): Promise<void> {
  await api.delete(API_ENDPOINTS.doctorAvailabilities.byId(id))
}

export async function activateDoctorAvailability(id: string): Promise<void> {
  await api.patch(API_ENDPOINTS.doctorAvailabilities.activate(id))
}

export async function deactivateDoctorAvailability(id: string): Promise<void> {
  await api.patch(API_ENDPOINTS.doctorAvailabilities.deactivate(id))
}

export async function getAvailableSlots(
  doctorId: string,
  date: string,
): Promise<AvailableSlot[]> {
  const res = await api.get<ApiSuccess<AvailableSlot[]>>(
    API_ENDPOINTS.doctorAvailabilities.slots,
    { params: { doctorId, date } },
  )
  return res.data
}

export async function getFirstAvailableSlot(
  doctorId: string,
): Promise<AvailableSlot | null> {
  const res = await api.get<ApiSuccess<AvailableSlot | null>>(
    API_ENDPOINTS.doctorAvailabilities.firstAvailable,
    { params: { doctorId } },
  )
  return res.data
}
