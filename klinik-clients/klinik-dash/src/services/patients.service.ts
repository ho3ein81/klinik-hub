import { api } from '@/lib/api-client'
import { API_ENDPOINTS, type ImageSize } from '@/config/api.config'
import type { ApiPaginated, ApiSuccess, ListQuery } from '@/types/api'
import type { Patient } from '@/types/domain'

export interface PatientInput {
  firstName: string
  lastName: string
  phone: string
  address?: string
  dateOfBirth?: string
}

function toFormData(
  input: Partial<PatientInput>,
  avatarFile?: File | null,
  avatarDelete?: boolean,
): FormData {
  const fd = new FormData()
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      fd.append(key, String(value))
    }
  })
  if (avatarFile) fd.append('avatar', avatarFile)
  if (avatarDelete) fd.append('avatarDelete', 'true')
  return fd
}

export function listPatients(params: ListQuery) {
  return api.get<ApiPaginated<Patient>>(API_ENDPOINTS.patients.list, { params })
}

export async function getPatient(id: string): Promise<Patient> {
  const res = await api.get<ApiSuccess<Patient>>(
    API_ENDPOINTS.patients.byId(id),
  )
  return res.data
}

export async function createPatient(
  input: PatientInput,
  avatarFile?: File | null,
): Promise<Patient> {
  const body = avatarFile ? toFormData(input, avatarFile) : input
  const res = await api.post<ApiSuccess<Patient>>(
    API_ENDPOINTS.patients.list,
    body,
  )
  return res.data
}

export async function updatePatient(
  id: string,
  input: Partial<PatientInput>,
  avatarFile?: File | null,
  avatarDelete?: boolean,
): Promise<Patient> {
  const body =
    avatarFile || avatarDelete
      ? toFormData(input, avatarFile, avatarDelete)
      : input
  const res = await api.patch<ApiSuccess<Patient>>(
    API_ENDPOINTS.patients.byId(id),
    body,
  )
  return res.data
}

export async function deletePatient(id: string): Promise<void> {
  await api.delete(API_ENDPOINTS.patients.byId(id))
}

export function patientAvatarUrl(filename: string, size?: ImageSize): string {
  return API_ENDPOINTS.patients.resource(filename, size)
}
