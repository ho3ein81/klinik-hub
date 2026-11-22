import { api } from '@/lib/api-client'
import { API_ENDPOINTS, CLINIC_ID, type ImageSize } from '@/config/api.config'
import type { ApiPaginated } from '@/types/api'
import type { Doctor } from '@/types/domain'

export function listDoctors(params: { page?: number; limit?: number } = {}) {
  return api.get<ApiPaginated<Doctor>>(API_ENDPOINTS.doctors.list, {
    params: { clinicId: CLINIC_ID, page: params.page, limit: params.limit },
  })
}

export function doctorAvatarUrl(filename: string, size?: ImageSize): string {
  return API_ENDPOINTS.doctors.resource(filename, size)
}
