import prisma from './prisma'
import { TransactionClient } from './base.repository'

/**
 * Runs `work` inside a single Prisma transaction: if any step throws, every
 * write made through the `tx` it receives is rolled back together.
 *
 * Pass `tx` as the trailing `client` argument on repository calls made
 * inside `work` so they all join the same transaction:
 *
 * ```ts
 * await unitOfWork(async (tx) => {
 *   const appointment = await appointmentRepository.create(data, tx)
 *   await notificationRepository.create({ ... }, tx)
 *   return appointment
 * })
 * ```
 */
export function unitOfWork<T>(
  work: (tx: TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(work)
}
