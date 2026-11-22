import type { AdminUser, ClinicUser, Patient } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      id?: string
      adminUser?: AdminUser
      clinicUser?: ClinicUser
      patient?: Patient
      validatedQuery?: any
      t: TFunction
    }
  }
}

export {}
