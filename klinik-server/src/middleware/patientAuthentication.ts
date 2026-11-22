import { Request, Response, NextFunction } from 'express'
import prisma from '../db/prisma'
import { UnauthorizedError } from '../utils/errors'
import { verifyAccessToken } from '../utils/jwt'
import { patientRepository } from '../modules/patients/patient.repository'

export async function patientAuthentication(
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

    if (payload.userType !== 'patient') {
      throw new UnauthorizedError('auth.invalidAuthentication')
    }

    const patient = await patientRepository.findById(payload.userId)

    if (!patient) {
      throw new UnauthorizedError('auth.invalidAuthentication')
    }

    req.patient = patient

    next()
  } catch (error) {
    next(
      error instanceof UnauthorizedError
        ? error
        : new UnauthorizedError('auth.invalidOrExpiredToken'),
    )
  }
}
