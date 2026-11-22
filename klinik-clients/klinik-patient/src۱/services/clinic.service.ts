import { api } from '@/lib/api-client'
import { API_ENDPOINTS, CLINIC_ID, type ImageSize } from '@/config/api.config'
import type { ApiSuccess } from '@/types/api'
import type { Clinic } from '@/types/domain'

export async function getClinic(): Promise<Clinic> {
  const res = await api.get<ApiSuccess<Clinic>>(API_ENDPOINTS.clinic.byId(CLINIC_ID))
  return res.data
}

export function clinicImageUrl(filename: string, size?: ImageSize): string {
  return API_ENDPOINTS.clinic.resource(filename, size)
}
