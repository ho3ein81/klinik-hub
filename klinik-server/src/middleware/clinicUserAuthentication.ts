import { Request, Response, NextFunction } from 'express'
import prisma from '../db/prisma'
import { UnauthorizedError } from '../utils/errors'
import { verifyAccessToken } from '../utils/jwt'
import { clinicUserRepository } from '../modules/clinicUsers/clinicUser.repository'

export async function clinicUserAuthentication(
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

    if (payload.userType !== 'clinicUser') {
      throw new UnauthorizedError('auth.invalidAuthentication')
    }

    const clinicUser = await clinicUserRepository.findById(payload.userId)

    if (!clinicUser || !clinicUser.isActive) {
      throw new UnauthorizedError('auth.invalidAuthentication')
    }

    req.clinicUser = clinicUser

    next()
  } catch (error) {
    next(
      error instanceof UnauthorizedError
        ? error
        : new UnauthorizedError('auth.invalidOrExpiredToken'),
    )
  }
}
