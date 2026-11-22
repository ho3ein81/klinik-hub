export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1'

const CLINIC_BASE = `${API_BASE_URL}/clinic`

/** `t` = 150x150 thumbnail, `m` = 400x400. Omit to get the original upload. */
export type ImageSize = 't' | 'm'

function withSize(url: string, size?: ImageSize): string {
  return size ? `${url}?size=${size}` : url
}

export const API_ENDPOINTS = {
  clinicUsers: {
    login: `${CLINIC_BASE}/clinic-users/login`,
    refreshToken: `${CLINIC_BASE}/clinic-users/refresh-token`,
    me: `${CLINIC_BASE}/clinic-users/me`,
    changePassword: `${CLINIC_BASE}/clinic-users/change-password`,
    list: `${CLINIC_BASE}/clinic-users`,
    byId: (id: string) => `${CLINIC_BASE}/clinic-users/${id}`,
    activate: (id: string) => `${CLINIC_BASE}/clinic-users/${id}/activate`,
    deactivate: (id: string) => `${CLINIC_BASE}/clinic-users/${id}/deactivate`,
    resource: (filename: string, size?: ImageSize) =>
      withSize(`${CLINIC_BASE}/clinic-users/read-resources/avatar/${filename}`, size),
  },
  clinics: {
    byId: (id: string) => `${CLINIC_BASE}/clinics/${id}`,
    resource: (filename: string, size?: ImageSize) =>
      withSize(`${CLINIC_BASE}/clinics/read-resources/image/${filename}`, size),
  },
  clinicContacts: {
    list: `${CLINIC_BASE}/clinic-contacts`,
    byId: (id: string) => `${CLINIC_BASE}/clinic-contacts/${id}`,
  },
  patients: {
    list: `${CLINIC_BASE}/patients`,
    byId: (id: string) => `${CLINIC_BASE}/patients/${id}`,
    resource: (filename: string, size?: ImageSize) =>
      withSize(`${CLINIC_BASE}/patients/read-resources/avatar/${filename}`, size),
  },
  services: {
    list: `${CLINIC_BASE}/services`,
    byId: (id: string) => `${CLINIC_BASE}/services/${id}`,
    activate: (id: string) => `${CLINIC_BASE}/services/${id}/activate`,
    deactivate: (id: string) => `${CLINIC_BASE}/services/${id}/deactivate`,
    resource: (filename: string, size?: ImageSize) =>
      withSize(`${CLINIC_BASE}/services/read-resources/image/${filename}`, size),
  },
  specialties: {
    list: `${CLINIC_BASE}/specialties`,
    byId: (id: string) => `${CLINIC_BASE}/specialties/${id}`,
    activate: (id: string) => `${CLINIC_BASE}/specialties/${id}/activate`,
    deactivate: (id: string) => `${CLINIC_BASE}/specialties/${id}/deactivate`,
  },
  doctorAvailabilities: {
    list: `${CLINIC_BASE}/doctor-availabilities`,
    byId: (id: string) => `${CLINIC_BASE}/doctor-availabilities/${id}`,
    activate: (id: string) =>
      `${CLINIC_BASE}/doctor-availabilities/${id}/activate`,
    deactivate: (id: string) =>
      `${CLINIC_BASE}/doctor-availabilities/${id}/deactivate`,
    slots: `${CLINIC_BASE}/doctor-availabilities/slots`,
    firstAvailable: `${CLINIC_BASE}/doctor-availabilities/slots/first-available`,
  },
  doctorBlockedTimes: {
    list: `${CLINIC_BASE}/doctor-blocked-times`,
    byId: (id: string) => `${CLINIC_BASE}/doctor-blocked-times/${id}`,
  },
  clinicSettings: {
    current: `${CLINIC_BASE}/clinic-settings`,
  },
  articles: {
    list: `${CLINIC_BASE}/articles`,
    byId: (id: string) => `${CLINIC_BASE}/articles/${id}`,
    publish: (id: string) => `${CLINIC_BASE}/articles/${id}/publish`,
    archive: (id: string) => `${CLINIC_BASE}/articles/${id}/archive`,
    resource: (filename: string, size?: ImageSize) =>
      withSize(`${CLINIC_BASE}/articles/read-resources/image/${filename}`, size),
  },
  appointments: {
    list: `${CLINIC_BASE}/appointments`,
    statistics: `${CLINIC_BASE}/appointments/statistics`,
    byId: (id: string) => `${CLINIC_BASE}/appointments/${id}`,
    approve: (id: string) => `${CLINIC_BASE}/appointments/${id}/approve`,
    complete: (id: string) => `${CLINIC_BASE}/appointments/${id}/complete`,
    reject: (id: string) => `${CLINIC_BASE}/appointments/${id}/reject`,
    notShow: (id: string) => `${CLINIC_BASE}/appointments/${id}/not-show`,
  },
} as const
