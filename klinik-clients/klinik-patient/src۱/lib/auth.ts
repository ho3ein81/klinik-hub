import type { Patient } from '@/types/domain'

const ACCESS_TOKEN_KEY = 'patientAccessToken'
const REFRESH_TOKEN_KEY = 'patientRefreshToken'
const CURRENT_PATIENT_KEY = 'currentPatient'

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function setAuthSession(
  accessToken: string,
  refreshToken: string,
  patient: Patient,
): void {
  if (!isBrowser()) return
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  localStorage.setItem(CURRENT_PATIENT_KEY, JSON.stringify(patient))
}

export function updateStoredPatient(patient: Patient): void {
  if (!isBrowser()) return
  localStorage.setItem(CURRENT_PATIENT_KEY, JSON.stringify(patient))
}

export function updateStoredTokens(
  accessToken: string,
  refreshToken: string,
): void {
  if (!isBrowser()) return
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearAuthSession(): void {
  if (!isBrowser()) return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(CURRENT_PATIENT_KEY)
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getCurrentPatient(): Patient | null {
  if (!isBrowser()) return null
  const raw = localStorage.getItem(CURRENT_PATIENT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Patient
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken())
}

export function currentLocaleFromPath(): string {
  if (!isBrowser()) return 'en'
  const segment = window.location.pathname.split('/')[1]
  return segment === 'de-CH' || segment === 'en' ? segment : 'en'
}
