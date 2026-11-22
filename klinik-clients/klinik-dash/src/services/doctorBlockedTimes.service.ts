import { api } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api.config'
import type { ApiPaginated, ApiSuccess, ListQuery } from '@/types/api'
import type { DoctorBlockedTime } from '@/types/domain'

export interface DoctorBlockedTimeInput {
  doctorId: string
  startDate: string
  endDate: string
  reason?: string
}

export function listDoctorBlockedTimes(
  params: ListQuery & { doctorId?: string },
) {
  return api.get<ApiPaginated<DoctorBlockedTime>>(
    API_ENDPOINTS.doctorBlockedTimes.list,
    { params },
  )
}

export async function createDoctorBlockedTime(
  input: DoctorBlockedTimeInput,
): Promise<DoctorBlockedTime> {
  const res = await api.post<ApiSuccess<DoctorBlockedTime>>(
    API_ENDPOINTS.doctorBlockedTimes.list,
    input,
  )
  return res.data
}

export async function deleteDoctorBlockedTime(id: string): Promise<void> {
  await api.delete(API_ENDPOINTS.doctorBlockedTimes.byId(id))
}
