import app from './app'
import { env } from './config/env'
import { connectDatabase, disconnectDatabase } from './config/database'
import { createInitialAdminUser } from './jobs/createInitialAdminUser'
import { backfillClinicSettings } from './jobs/backfillClinicSettings'
import { scheduleJobs } from './jobs/scheduler'
import { logger } from './utils/logger'

async function startServer(): Promise<void> {
  try {
    await connectDatabase()

    await createInitialAdminUser()
    await backfillClinicSettings()

    scheduleJobs()

    const server = app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`)
    })

    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received. Shutting down...`)

      server.close(async () => {
        await disconnectDatabase()
        process.exit(0)
      })
    }

    process.on('SIGTERM', () => {
      void shutdown('SIGTERM')
    })

    process.on('SIGINT', () => {
      void shutdown('SIGINT')
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    await disconnectDatabase()
    process.exit(1)
  }
}

void startServer()
