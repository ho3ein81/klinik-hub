import { api } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api.config'
import type { ApiPaginated, ApiSuccess, ListQuery } from '@/types/api'
import type { ClinicContact, ContactType } from '@/types/domain'

export interface ClinicContactInput {
  name: string
  contactType: ContactType
  value: string
  isPrimary?: boolean
}

export function listClinicContacts(params: ListQuery) {
  return api.get<ApiPaginated<ClinicContact>>(
    API_ENDPOINTS.clinicContacts.list,
    { params },
  )
}

export async function createClinicContact(
  input: ClinicContactInput,
): Promise<ClinicContact> {
  const res = await api.post<ApiSuccess<ClinicContact>>(
    API_ENDPOINTS.clinicContacts.list,
    input,
  )
  return res.data
}

export async function updateClinicContact(
  id: string,
  input: Partial<ClinicContactInput>,
): Promise<ClinicContact> {
  const res = await api.patch<ApiSuccess<ClinicContact>>(
    API_ENDPOINTS.clinicContacts.byId(id),
    input,
  )
  return res.data
}

export async function deleteClinicContact(id: string): Promise<void> {
  await api.delete(API_ENDPOINTS.clinicContacts.byId(id))
}
