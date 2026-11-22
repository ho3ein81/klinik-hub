import { api } from '@/lib/api-client'
import { API_ENDPOINTS, CLINIC_ID, type ImageSize } from '@/config/api.config'
import type { ApiPaginated } from '@/types/api'
import type { StaffMember } from '@/types/domain'

export function listStaff(params: { page?: number; limit?: number } = {}) {
  return api.get<ApiPaginated<StaffMember>>(API_ENDPOINTS.staff.list, {
    params: { clinicId: CLINIC_ID, page: params.page, limit: params.limit },
  })
}

export function staffAvatarUrl(filename: string, size?: ImageSize): string {
  return API_ENDPOINTS.staff.resource(filename, size)
}
