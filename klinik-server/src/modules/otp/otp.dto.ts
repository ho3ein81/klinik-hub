import { OtpPurpose } from '@prisma/client'

export interface CreateOtpDto {
  phone: string
  purpose: OtpPurpose
}

export interface ResponseOtpDto {
  id: string
  phone: string
  purpose: OtpPurpose
  expiresAt: Date
  verifiedAt: Date | null
  attempts: number
  createdAt: Date
}
