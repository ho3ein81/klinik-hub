import { API_ENDPOINTS } from '@/config/api.config'
import {
  clearAuthSession,
  currentLocaleFromPath,
  getAccessToken,
  getRefreshToken,
  updateStoredTokens,
} from '@/lib/auth'
import type { ApiFailure } from '@/types/api'

export class ApiError extends Error {
  status: number
  errors?: unknown

  constructor(message: string, status: number, errors?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  params?: Record<string, string | number | boolean | undefined | null>
  /** Skip Bearer injection + 401 refresh retry — used for login/refresh-token themselves. */
  skipAuth?: boolean
}

/**
 * How long Next.js may reuse a server-rendered GET before asking the API again.
 * Public pages are rendered on the server (that is what puts the clinic, the
 * doctors and the services into the HTML a crawler reads), so without this every
 * visit and every crawled URL would re-query the API. Five minutes keeps
 * dashboard edits visible quickly while absorbing a crawl.
 */
const SERVER_REVALIDATE_SECONDS = 300

function buildUrl(url: string, params?: RequestOptions['params']): string {
  if (!params) return url
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.append(key, String(value))
    }
  })
  const qs = search.toString()
  return qs ? `${url}${url.includes('?') ? '&' : '?'}${qs}` : url
}

function redirectToPatientPortal(): void {
  if (typeof window === 'undefined') return
  clearAuthSession()
  const locale = currentLocaleFromPath()
  if (!window.location.pathname.includes('/patient')) {
    window.location.href = `/${locale}/patient`
  }
}

let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false

    try {
      const response = await fetch(API_ENDPOINTS.patients.refreshToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.data?.accessToken) return false

      updateStoredTokens(result.data.accessToken, result.data.refreshToken)
      return true
    } catch {
      return false
    }
  })()

  const result = await refreshPromise
  refreshPromise = null
  return result
}

async function performRequest<T>(
  url: string,
  options: RequestOptions,
): Promise<T> {
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData

  const headers: Record<string, string> = {
    'Accept-Language': currentLocaleFromPath(),
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }
  if (!options.skipAuth) {
    const token = getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  // Cache only anonymous GETs rendered on the server. In the browser `next` is
  // ignored, and the Authorization check means a per-patient response could
  // never end up in a cache shared by every visitor (it cannot happen today —
  // the token lives in localStorage, so getAccessToken() returns null on the
  // server — but the guard keeps that from becoming a silent leak later).
  const isCacheableServerRead =
    typeof window === 'undefined' &&
    (options.method ?? 'GET') === 'GET' &&
    !headers.Authorization

  const response = await fetch(buildUrl(url, options.params), {
    method: options.method ?? 'GET',
    headers,
    body: isFormData
      ? (options.body as FormData)
      : options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
    ...(isCacheableServerRead
      ? { next: { revalidate: SERVER_REVALIDATE_SECONDS } }
      : {}),
  })

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const failure = payload as ApiFailure | null
    throw new ApiError(
      failure?.message ?? `Request failed with status ${response.status}`,
      response.status,
      failure?.errors,
    )
  }

  return payload as T
}

export async function apiClient<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  try {
    return await performRequest<T>(url, options)
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      !options.skipAuth &&
      getRefreshToken()
    ) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        return performRequest<T>(url, options)
      }
    }
    if (error instanceof ApiError && error.status === 401 && getAccessToken()) {
      redirectToPatientPortal()
    }
    throw error
  }
}

/** Fetches a binary resource (avatar/service/doctor photo) as a local object URL. */
export async function fetchBlobUrl(url: string): Promise<string> {
  const token = getAccessToken()
  const response = await fetch(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Accept-Language': currentLocaleFromPath(),
    },
  })
  if (!response.ok) {
    throw new ApiError('Failed to load resource', response.status)
  }
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

export const api = {
  get: <T>(url: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiClient<T>(url, { ...options, method: 'GET' }),
  post: <T>(
    url: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) => apiClient<T>(url, { ...options, method: 'POST', body }),
  patch: <T>(
    url: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) => apiClient<T>(url, { ...options, method: 'PATCH', body }),
  delete: <T>(url: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiClient<T>(url, { ...options, method: 'DELETE' }),
}
