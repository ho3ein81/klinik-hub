import { api } from '@/lib/api-client'
import { API_ENDPOINTS, CLINIC_ID } from '@/config/api.config'
import type { ApiPaginated } from '@/types/api'
import type { ClinicContact } from '@/types/domain'

export function listClinicContacts(params: { page?: number; limit?: number } = {}) {
  return api.get<ApiPaginated<ClinicContact>>(API_ENDPOINTS.clinicContacts.list, {
    params: { clinicId: CLINIC_ID, page: params.page, limit: params.limit },
  })
}
