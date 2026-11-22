// Shapes returned by the klinik-server backend (src/utils/response.ts on the API side).

export interface ApiSuccess<T> {
  success: true
  message: string
  data: T
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface ApiPaginated<T> {
  success: true
  message: string
  data: T[]
  meta: PaginationMeta
}

export interface ApiFailure {
  success: false
  message: string
  errors?: unknown
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

export interface ListQuery {
  [key: string]: string | number | boolean | undefined
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
