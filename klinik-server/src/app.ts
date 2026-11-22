import express, { Request, Response } from 'express'
import routes from './routes'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'
import cors from 'cors'
import { i18nMiddleware } from './config/i18n'
import { env } from './config/env'

const app = express()

// CORS_ORIGINS is a comma-separated allowlist. Unset — the local development
// default — keeps the previous behaviour of allowing every origin.
const allowedOrigins = env.CORS_ORIGINS?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors(
    allowedOrigins?.length
      ? {
          origin: allowedOrigins,
          credentials: true,
        }
      : undefined,
  ),
)

// Liveness probe for the container healthcheck and any external monitor.
// Registered before the logger so health polling every few seconds doesn't
// bury the real request log, and before /api/v1 so it needs no auth or locale.
// Deliberately does not touch the database: this reports whether the process
// is up, and a DB round-trip here would make dependent containers flap
// whenever Postgres is briefly slow.
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

app.use(requestLogger)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(i18nMiddleware)

app.use('/api/v1', routes)

app.use(errorHandler)

export default app
