import { api } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api.config'
import { clearAuthSession, setAuthSession, updateStoredUser } from '@/lib/auth'
import type { ApiSuccess } from '@/types/api'
import type { ClinicUser } from '@/types/domain'

interface LoginData {
  accessToken: string
  refreshToken: string
  user: ClinicUser
}

export async function login(
  email: string,
  password: string,
): Promise<ClinicUser> {
  const res = await api.post<ApiSuccess<LoginData>>(
    API_ENDPOINTS.clinicUsers.login,
    { email, password },
    { skipAuth: true },
  )
  setAuthSession(res.data.accessToken, res.data.refreshToken, res.data.user)
  return res.data.user
}

export async function fetchCurrentUser(): Promise<ClinicUser> {
  const res = await api.get<ApiSuccess<ClinicUser>>(
    API_ENDPOINTS.clinicUsers.me,
  )
  updateStoredUser(res.data)
  return res.data
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await api.post(API_ENDPOINTS.clinicUsers.changePassword, {
    currentPassword,
    newPassword,
  })
}

export function logout(): void {
  clearAuthSession()
}
