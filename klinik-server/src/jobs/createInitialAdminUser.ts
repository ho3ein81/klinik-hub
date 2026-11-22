import { env } from '../config/env'
import { adminUserRepository } from '../modules/adminUsers/adminUser.repository'
import { logger } from '../utils/logger'
import { hashPassword } from '../utils/password'

export async function createInitialAdminUser(): Promise<void> {
  const existingAdmin = await adminUserRepository.findOne({
    username: env.INITIAL_ADMIN_USERNAME,
  })

  // Matched on username, so an existing admin is never re-created and never
  // has its password reset from the environment.
  if (existingAdmin) {
    return
  }

  const passwordHash = await hashPassword(env.INITIAL_ADMIN_PASSWORD)

  await adminUserRepository.create({
    username: env.INITIAL_ADMIN_USERNAME,
    passwordHash,
    isActive: true,
  })

  logger.info('Initial admin user created.')
}
