import { api } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api.config'
import { clearAuthSession, setAuthSession, updateStoredPatient } from '@/lib/auth'
import type { ApiSuccess } from '@/types/api'
import type { Patient } from '@/types/domain'

interface LoginData {
  accessToken: string
  refreshToken: string
  patient: Patient
}

export async function requestLoginOtp(phone: string): Promise<void> {
  await api.post(API_ENDPOINTS.patients.requestOtp, { phone }, { skipAuth: true })
}

export async function loginWithOtp(phone: string, code: string): Promise<Patient> {
  const res = await api.post<ApiSuccess<LoginData>>(
    API_ENDPOINTS.patients.login,
    { phone, code },
    { skipAuth: true },
  )
  setAuthSession(res.data.accessToken, res.data.refreshToken, res.data.patient)
  return res.data.patient
}

export async function fetchCurrentPatient(): Promise<Patient> {
  const res = await api.get<ApiSuccess<Patient>>(API_ENDPOINTS.patients.me)
  updateStoredPatient(res.data)
  return res.data
}

export interface UpdateProfileInput {
  firstName?: string
  lastName?: string
  address?: string
  dateOfBirth?: string
}

function toFormData(input: UpdateProfileInput, avatarFile?: File | null): FormData {
  const fd = new FormData()
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      fd.append(key, String(value))
    }
  })
  if (avatarFile) fd.append('avatar', avatarFile)
  return fd
}

export async function updateProfile(
  input: UpdateProfileInput,
  avatarFile?: File | null,
): Promise<Patient> {
  const body = avatarFile ? toFormData(input, avatarFile) : input
  const res = await api.patch<ApiSuccess<Patient>>(API_ENDPOINTS.patients.me, body)
  updateStoredPatient(res.data)
  return res.data
}

export function logout(): void {
  clearAuthSession()
}

export function patientAvatarUrl(filename: string): string {
  return API_ENDPOINTS.patients.resource(filename, 'm')
}
