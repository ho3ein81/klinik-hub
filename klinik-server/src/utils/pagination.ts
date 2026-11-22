import { PaginationQuery } from '../validations/pagination'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export function getPaginationParams(query: PaginationQuery) {
  const page = query.page ?? 1
  const limit = query.limit ?? 20
  const skip = (page - 1) * limit

  return { skip, take: limit, page, limit }
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}
