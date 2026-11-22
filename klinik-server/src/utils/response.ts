import { Response } from 'express'
import { PaginationMeta } from './pagination'

export function successResponse<T>(
  res: Response,
  data: T,
  message = 'common.success',
  statusCode = 200,
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  })
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  message = 'common.success',
  statusCode = 200,
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  })
}

export function errorResponse(
  res: Response,
  message = 'errors.internalServerError',
  statusCode = 500,
  errors?: unknown,
) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  })
}
