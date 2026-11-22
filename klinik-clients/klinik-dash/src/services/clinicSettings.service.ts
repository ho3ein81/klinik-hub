import { api } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api.config'
import type { ApiSuccess } from '@/types/api'
import type { ClinicSetting } from '@/types/domain'

export async function getClinicSetting(): Promise<ClinicSetting> {
  const res = await api.get<ApiSuccess<ClinicSetting>>(
    API_ENDPOINTS.clinicSettings.current,
  )
  return res.data
}

export async function updateClinicSetting(
  input: { allowPatientBooking?: boolean; showArticle?: boolean },
): Promise<ClinicSetting> {
  const res = await api.patch<ApiSuccess<ClinicSetting>>(
    API_ENDPOINTS.clinicSettings.current,
    input,
  )
  return res.data
}
