import { api } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api.config'
import type { ApiPaginated, ApiSuccess, ListQuery } from '@/types/api'
import type { Specialty } from '@/types/domain'

export interface SpecialtyInput {
  name: string
  description?: string
}

export function listSpecialties(params: ListQuery & { isActive?: boolean }) {
  return api.get<ApiPaginated<Specialty>>(API_ENDPOINTS.specialties.list, {
    params,
  })
}

export async function getSpecialty(id: string): Promise<Specialty> {
  const res = await api.get<ApiSuccess<Specialty>>(
    API_ENDPOINTS.specialties.byId(id),
  )
  return res.data
}

export async function createSpecialty(
  input: SpecialtyInput,
): Promise<Specialty> {
  const res = await api.post<ApiSuccess<Specialty>>(
    API_ENDPOINTS.specialties.list,
    input,
  )
  return res.data
}

export async function updateSpecialty(
  id: string,
  input: Partial<SpecialtyInput>,
): Promise<Specialty> {
  const res = await api.patch<ApiSuccess<Specialty>>(
    API_ENDPOINTS.specialties.byId(id),
    input,
  )
  return res.data
}

export async function deleteSpecialty(id: string): Promise<void> {
  await api.delete(API_ENDPOINTS.specialties.byId(id))
}

export async function activateSpecialty(id: string): Promise<void> {
  await api.patch(API_ENDPOINTS.specialties.activate(id))
}

export async function deactivateSpecialty(id: string): Promise<void> {
  await api.patch(API_ENDPOINTS.specialties.deactivate(id))
}
