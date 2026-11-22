import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { MulterError } from 'multer'
import { AppError } from '../utils/errors'
import { errorResponse } from '../utils/response'
import { logger } from '../utils/logger'

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Application errors
  if (err instanceof AppError) {
    const message = req.t ? req.t(err.message) : err.message
    return errorResponse(res, message, err.statusCode, err.errors)
  }

  // Zod validation errors
  if (err instanceof z.ZodError) {
    return errorResponse(
      res,
      req.t('errors.validationFailed'),
      400,
      z.treeifyError(err),
    )
  }

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      // Unique constraint
      case 'P2002':
        return errorResponse(res, req.t('errors.resourceAlreadyExists'), 409, {
          fields: err.meta?.target,
        })

      // Record not found
      case 'P2025':
        return errorResponse(res, req.t('errors.resourceNotFound'), 404)

      default:
        return errorResponse(res, req.t('errors.databaseError'), 500)
    }
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return errorResponse(res, req.t('errors.invalidDatabaseRequest'), 400)
  }

  // Multer file upload errors
  if (err instanceof MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return errorResponse(res, req.t('errors.fileTooLarge'), 400)

      case 'LIMIT_FILE_COUNT':
        return errorResponse(res, req.t('errors.tooManyFiles'), 400)

      default:
        return errorResponse(res, req.t('errors.fileUploadError'), 400)
    }
  }

  // Unknown errors
  logger.error(err)
  return errorResponse(res, req.t('errors.internalServerError'), 500)
}
