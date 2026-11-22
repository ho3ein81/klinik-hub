import { Request, Response, NextFunction } from 'express'
import { ForbiddenError } from '../utils/errors'
import { ClinicUserType } from '@prisma/client'

/** Only an ADMIN-type clinic user may proceed. */
export function requireClinicAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (req.clinicUser?.type !== ClinicUserType.ADMIN) {
    next(new ForbiddenError('clinicUser.adminOnly'))
    return
  }
  next()
}

/** An ADMIN-type clinic user, or a clinic user acting on their own record. */
export function requireClinicAdminOrSelf(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (
    req.clinicUser?.type === ClinicUserType.ADMIN ||
    req.clinicUser?.id === req.params.id
  ) {
    next()
    return
  }
  next(new ForbiddenError('clinicUser.adminOnly'))
}

/** Only an ADMIN or DOCTOR-type clinic user may proceed. */
export function requireDoctorOrAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (
    req.clinicUser?.type === ClinicUserType.ADMIN ||
    req.clinicUser?.type === ClinicUserType.DOCTOR
  ) {
    next()
    return
  }
  next(new ForbiddenError('doctorAvailability.doctorOrAdminOnly'))
}
