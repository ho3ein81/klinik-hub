import { api } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api.config'
import type { ApiSuccess } from '@/types/api'
import type { AvailableSlot, DoctorAvailability } from '@/types/domain'

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

export async function getDoctorWeeklyAvailability(
  doctorId: string,
): Promise<DoctorAvailability[]> {
  const res = await api.get<ApiSuccess<DoctorAvailability[]>>(
    API_ENDPOINTS.doctorAvailabilities.list,
    { params: { doctorId } },
  )
  return res.data
}
