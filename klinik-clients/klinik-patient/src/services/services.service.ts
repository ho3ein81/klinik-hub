import { api } from '@/lib/api-client'
import { API_ENDPOINTS, CLINIC_ID, type ImageSize } from '@/config/api.config'
import type { ApiPaginated, ApiSuccess } from '@/types/api'
import type { Service } from '@/types/domain'

export function listServices(params: { page?: number; limit?: number } = {}) {
  return api.get<ApiPaginated<Service>>(API_ENDPOINTS.services.list, {
    params: { clinicId: CLINIC_ID, page: params.page, limit: params.limit },
  })
}

export async function getService(id: string): Promise<Service> {
  const res = await api.get<ApiSuccess<Service>>(API_ENDPOINTS.services.byId(id))
  return res.data
}

export function serviceImageUrl(filename: string, size?: ImageSize): string {
  return API_ENDPOINTS.services.resource(filename, size)
}
