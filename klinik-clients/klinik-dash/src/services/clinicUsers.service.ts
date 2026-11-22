import { api } from '@/lib/api-client'
import { API_ENDPOINTS, type ImageSize } from '@/config/api.config'
import type { ApiPaginated, ApiSuccess, ListQuery } from '@/types/api'
import type { ClinicUser, ClinicUserType } from '@/types/domain'

export interface ClinicUserInput {
  email: string
  firstName: string
  lastName: string
  phone?: string
  password?: string
  type: ClinicUserType
  specialtyIds?: string[]
}

function toFormData(
  input: Partial<ClinicUserInput>,
  avatarFile?: File | null,
  avatarDelete?: boolean,
): FormData {
  const fd = new FormData()
  Object.entries(input).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (Array.isArray(value)) {
      value.forEach((item) => fd.append(key, String(item)))
    } else {
      fd.append(key, String(value))
    }
  })
  if (avatarFile) fd.append('avatar', avatarFile)
  if (avatarDelete) fd.append('avatarDelete', 'true')
  return fd
}

export function listClinicUsers(params: ListQuery) {
  return api.get<ApiPaginated<ClinicUser>>(API_ENDPOINTS.clinicUsers.list, {
    params,
  })
}

export async function getClinicUser(id: string): Promise<ClinicUser> {
  const res = await api.get<ApiSuccess<ClinicUser>>(
    API_ENDPOINTS.clinicUsers.byId(id),
  )
  return res.data
}

export async function createClinicUser(
  input: ClinicUserInput,
  avatarFile?: File | null,
): Promise<ClinicUser> {
  const body = avatarFile ? toFormData(input, avatarFile) : input
  const res = await api.post<ApiSuccess<ClinicUser>>(
    API_ENDPOINTS.clinicUsers.list,
    body,
  )
  return res.data
}

export async function updateClinicUser(
  id: string,
  input: Partial<ClinicUserInput>,
  avatarFile?: File | null,
  avatarDelete?: boolean,
): Promise<ClinicUser> {
  const body =
    avatarFile || avatarDelete
      ? toFormData(input, avatarFile, avatarDelete)
      : input
  const res = await api.patch<ApiSuccess<ClinicUser>>(
    API_ENDPOINTS.clinicUsers.byId(id),
    body,
  )
  return res.data
}

export async function deleteClinicUser(id: string): Promise<void> {
  await api.delete(API_ENDPOINTS.clinicUsers.byId(id))
}

export async function activateClinicUser(id: string): Promise<void> {
  await api.patch(API_ENDPOINTS.clinicUsers.activate(id))
}

export async function deactivateClinicUser(id: string): Promise<void> {
  await api.patch(API_ENDPOINTS.clinicUsers.deactivate(id))
}

export function clinicUserAvatarUrl(filename: string, size?: ImageSize): string {
  return API_ENDPOINTS.clinicUsers.resource(filename, size)
}
