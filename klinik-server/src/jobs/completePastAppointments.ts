import { AppointmentStatus } from '@prisma/client'
import { appointmentRepository } from '../modules/appointments/appointment.repository'
import { logger } from '../utils/logger'

/**
 * Auto-completes appointments whose date has already passed but were left in
 * BOOKED/APPROVED (the clinic never marked them COMPLETED/NOT_SHOW/CANCELLED).
 * Runs daily at 00:00:00, so "today's" appointments are settled the moment
 * the day ends.
 */
export async function completePastAppointments(): Promise<void> {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const { count } = await appointmentRepository.update(
    {
      date: { lt: startOfToday },
      status: { in: [AppointmentStatus.BOOKED, AppointmentStatus.APPROVED] },
    },
    { status: AppointmentStatus.COMPLETED },
  )

  if (count > 0) {
    logger.info(`Auto-completed ${count} past appointment(s).`)
  }
}
