import { Otp } from '@prisma/client'
import { ResponseOtpDto } from './otp.dto'

export const toOtpDto = (otp: Otp): ResponseOtpDto => ({
  id: otp.id,
  phone: otp.phone,
  purpose: otp.purpose,
  expiresAt: otp.expiresAt,
  verifiedAt: otp.verifiedAt,
  attempts: otp.attempts,
  createdAt: otp.createdAt,
})
