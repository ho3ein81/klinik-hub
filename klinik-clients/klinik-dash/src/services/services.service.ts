import { api } from '@/lib/api-client'
import { API_ENDPOINTS, type ImageSize } from '@/config/api.config'
import type { ApiPaginated, ApiSuccess, ListQuery } from '@/types/api'
import type { Service } from '@/types/domain'

export interface ServiceInput {
  name: string
  description?: string
  price?: number
  duration?: number
  order?: number
}

function toFormData(
  input: Partial<ServiceInput>,
  imageFile?: File | null,
): FormData {
  const fd = new FormData()
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      fd.append(key, String(value))
    }
  })
  if (imageFile) fd.append('image', imageFile)
  return fd
}

export function listServices(params: ListQuery & { isActive?: boolean }) {
  return api.get<ApiPaginated<Service>>(API_ENDPOINTS.services.list, { params })
}

export async function getService(id: string): Promise<Service> {
  const res = await api.get<ApiSuccess<Service>>(
    API_ENDPOINTS.services.byId(id),
  )
  return res.data
}

export async function createService(
  input: ServiceInput,
  imageFile?: File | null,
): Promise<Service> {
  const body = imageFile ? toFormData(input, imageFile) : input
  const res = await api.post<ApiSuccess<Service>>(
    API_ENDPOINTS.services.list,
    body,
  )
  return res.data
}

export async function updateService(
  id: string,
  input: Partial<ServiceInput>,
  imageFile?: File | null,
): Promise<Service> {
  const body = imageFile ? toFormData(input, imageFile) : input
  const res = await api.patch<ApiSuccess<Service>>(
    API_ENDPOINTS.services.byId(id),
    body,
  )
  return res.data
}

export async function deleteService(id: string): Promise<void> {
  await api.delete(API_ENDPOINTS.services.byId(id))
}

export async function activateService(id: string): Promise<void> {
  await api.patch(API_ENDPOINTS.services.activate(id))
}

export async function deactivateService(id: string): Promise<void> {
  await api.patch(API_ENDPOINTS.services.deactivate(id))
}

export function serviceImageUrl(filename: string, size?: ImageSize): string {
  return API_ENDPOINTS.services.resource(filename, size)
}
