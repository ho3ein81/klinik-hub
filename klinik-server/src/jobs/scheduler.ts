import cron from 'node-cron'
import { completePastAppointments } from './completePastAppointments'
import { logger } from '../utils/logger'

function runCompletePastAppointments(): void {
  completePastAppointments().catch((error) => {
    logger.error('Failed to auto-complete past appointments:', error)
  })
}

export function scheduleJobs(): void {
  // Runs every day at 00:00:00 server time.
  cron.schedule('0 0 * * *', runCompletePastAppointments)

  // Also run once at startup so appointments aren't stuck in BOOKED/APPROVED
  // if the server happened to be down at midnight.
  runCompletePastAppointments()
}
