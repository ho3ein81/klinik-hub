export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1'

// This app serves a single clinic — every public listing is scoped to it.
export const CLINIC_ID = process.env.NEXT_PUBLIC_CLINIC_ID || ''

const PATIENT_BASE = `${API_BASE_URL}/patient`

/** `t` = 150x150 thumbnail, `m` = 400x400. Omit to get the original upload. */
export type ImageSize = 't' | 'm'

function withSize(url: string, size?: ImageSize): string {
  return size ? `${url}?size=${size}` : url
}

export const API_ENDPOINTS = {
  clinic: {
    byId: (id: string) => `${PATIENT_BASE}/clinic/${id}`,
    resource: (filename: string, size?: ImageSize) =>
      withSize(`${PATIENT_BASE}/clinic/read-resources/image/${filename}`, size),
  },
  services: {
    list: `${PATIENT_BASE}/services`,
    byId: (id: string) => `${PATIENT_BASE}/services/${id}`,
    resource: (filename: string, size?: ImageSize) =>
      withSize(`${PATIENT_BASE}/services/read-resources/image/${filename}`, size),
  },
  doctors: {
    list: `${PATIENT_BASE}/doctors`,
    resource: (filename: string, size?: ImageSize) =>
      withSize(`${PATIENT_BASE}/doctors/read-resources/avatar/${filename}`, size),
  },
  staff: {
    list: `${PATIENT_BASE}/staff`,
    resource: (filename: string, size?: ImageSize) =>
      withSize(`${PATIENT_BASE}/staff/read-resources/avatar/${filename}`, size),
  },
  clinicContacts: {
    list: `${PATIENT_BASE}/clinic-contacts`,
  },
  doctorAvailabilities: {
    list: `${PATIENT_BASE}/doctor-availabilities`,
    slots: `${PATIENT_BASE}/doctor-availabilities/slots`,
    firstAvailable: `${PATIENT_BASE}/doctor-availabilities/slots/first-available`,
  },
  clinicSettings: {
    byId: (clinicId: string) => `${PATIENT_BASE}/clinic-settings/${clinicId}`,
  },
  articles: {
    list: `${PATIENT_BASE}/articles`,
    byId: (id: string) => `${PATIENT_BASE}/articles/${id}`,
    resource: (filename: string, size?: ImageSize) =>
      withSize(`${PATIENT_BASE}/articles/read-resources/image/${filename}`, size),
  },
  patients: {
    requestOtp: `${PATIENT_BASE}/patients/request-otp`,
    login: `${PATIENT_BASE}/patients/login`,
    refreshToken: `${PATIENT_BASE}/patients/refresh-token`,
    me: `${PATIENT_BASE}/patients/me`,
    resource: (filename: string, size?: ImageSize) =>
      withSize(`${PATIENT_BASE}/patients/read-resources/avatar/${filename}`, size),
  },
  appointments: {
    anonymousRequestOtp: `${PATIENT_BASE}/appointments/anonymous/request-otp`,
    bookAnonymous: `${PATIENT_BASE}/appointments/anonymous`,
    list: `${PATIENT_BASE}/appointments`,
    byId: (id: string) => `${PATIENT_BASE}/appointments/${id}`,
    cancel: (id: string) => `${PATIENT_BASE}/appointments/${id}/cancel`,
    reschedule: (id: string) => `${PATIENT_BASE}/appointments/${id}/reschedule`,
  },
} as const
