import { Request, Response, NextFunction } from 'express'
import { randomUUID } from 'crypto'
import { logger } from '../utils/logger'

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.socket.remoteAddress ?? 'unknown'
}

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId = randomUUID()
  req.id = requestId

  const start = process.hrtime.bigint()
  const { method, originalUrl } = req
  const ip = getClientIp(req)

  // --- log at request start ---
  logger.info(`--> ${method} ${originalUrl}`, {
    requestId,
    method,
    url: originalUrl,
    ip,
  })

  // --- log at request end ---
  res.on('finish', () => {
    const end = process.hrtime.bigint()
    const durationMs = Number(end - start) / 1_000_000
    const { statusCode } = res

    const level =
      statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'

    logger.log(
      level,
      `<-- ${method} ${originalUrl} ${statusCode} ${durationMs.toFixed(1)}ms`,
      {
        requestId,
        method,
        url: originalUrl,
        statusCode,
        durationMs: Number(durationMs.toFixed(1)),
        ip,
      },
    )
  })

  next()
}
