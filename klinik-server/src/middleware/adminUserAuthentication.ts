import { Request, Response, NextFunction } from 'express'
import prisma from '../db/prisma'
import { UnauthorizedError } from '../utils/errors'
import { verifyAccessToken } from '../utils/jwt'
import { adminUserRepository } from '../modules/adminUsers/adminUser.repository'

export async function adminUserAuthentication(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.headers.authorization?.split(' ')[1] // Bearer <token>

    if (!token) {
      throw new UnauthorizedError('auth.noTokenProvided')
    }

    const payload = verifyAccessToken(token)

    if (payload.userType !== 'adminUser') {
      throw new UnauthorizedError('auth.invalidAuthentication')
    }

    const adminUser = await adminUserRepository.findById(payload.userId)

    if (!adminUser || !adminUser.isActive) {
      throw new UnauthorizedError('auth.invalidAuthentication')
    }

    req.adminUser = adminUser

    next()
  } catch (error) {
    next(
      error instanceof UnauthorizedError
        ? error
        : new UnauthorizedError('auth.invalidOrExpiredToken'),
    )
  }
}
