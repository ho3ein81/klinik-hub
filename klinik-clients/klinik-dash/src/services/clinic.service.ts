import { api } from '@/lib/api-client'
import { API_ENDPOINTS, type ImageSize } from '@/config/api.config'
import type { ApiSuccess } from '@/types/api'
import type { Clinic } from '@/types/domain'

export interface ClinicInput {
  name?: string
  description?: string
  address?: string
}

export async function getClinic(id: string): Promise<Clinic> {
  const res = await api.get<ApiSuccess<Clinic>>(API_ENDPOINTS.clinics.byId(id))
  return res.data
}

export async function updateClinic(
  id: string,
  input: ClinicInput,
  imageFile?: File | null,
): Promise<Clinic> {
  let body: ClinicInput | FormData = input
  if (imageFile) {
    const fd = new FormData()
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined && value !== null) fd.append(key, String(value))
    })
    fd.append('image', imageFile)
    body = fd
  }
  const res = await api.patch<ApiSuccess<Clinic>>(
    API_ENDPOINTS.clinics.byId(id),
    body,
  )
  return res.data
}

export function clinicImageUrl(filename: string, size?: ImageSize): string {
  return API_ENDPOINTS.clinics.resource(filename, size)
}
