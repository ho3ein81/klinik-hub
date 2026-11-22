import { api } from '@/lib/api-client'
import { API_ENDPOINTS, CLINIC_ID } from '@/config/api.config'
import type { ApiSuccess } from '@/types/api'
import type { ClinicSetting } from '@/types/domain'

export async function getClinicSetting(): Promise<ClinicSetting> {
  const res = await api.get<ApiSuccess<ClinicSetting>>(
    API_ENDPOINTS.clinicSettings.byId(CLINIC_ID),
  )
  return res.data
}
