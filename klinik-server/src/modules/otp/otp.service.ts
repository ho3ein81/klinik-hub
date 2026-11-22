import i18next from 'i18next'
import { NotificationType, OtpPurpose } from '@prisma/client'
import { otpRepository } from './otp.repository'
import { hashPassword, verifyPassword } from '../../utils/password'
import { TooManyRequestsError, UnauthorizedError } from '../../utils/errors'
import { generateCode } from '../../utils/generateOtpCode'
import { env } from '../../config/env'
import { logger } from '../../utils/logger'
import { sendNotification } from '../notifications/notification.service'

export async function generateOtp(
  phone: string,
  purpose: OtpPurpose,
  lang = 'en',
): Promise<string> {
  const { data: recent } = await otpRepository.findAll({
    where: { phone, purpose },
    orderBy: { createdAt: 'desc' },
    take: 1,
  })

  const cooldownMs = env.OTP_RESEND_COOLDOWN_SECONDS * 1000
  if (recent[0] && Date.now() - recent[0].createdAt.getTime() < cooldownMs) {
    throw new TooManyRequestsError('otp.tooManyRequests')
  }

  const code = generateCode()
  console.log('code:', code)
  const codeHash = await hashPassword(code)
  const expiresAt = new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000)

  await otpRepository.create({
    phone,
    codeHash,
    purpose,
    expiresAt,
  })

  const content = i18next.t('notifications.otpCode', {
    lng: lang,
    code,
    minutes: env.OTP_TTL_MINUTES,
  })

  const notification = await sendNotification({
    type: NotificationType.SMS,
    recipient: phone,
    content,
  })

  if (notification.status === 'FAILED') {
    logger.error(
      `Failed to send OTP SMS to ${phone}: ${notification.errorMessage}`,
    )
  }

  return code
}

export async function verifyOtp(
  phone: string,
  code: string,
  purpose: OtpPurpose,
): Promise<void> {
  const { data } = await otpRepository.findAll({
    where: { phone, purpose },
    orderBy: { createdAt: 'desc' },
    skip: 0,
    take: 1,
  })

  const otp = data[0]

  if (!otp || otp.verifiedAt) {
    throw new UnauthorizedError('Invalid or expired OTP')
  }

  if (otp.expiresAt.getTime() < Date.now()) {
    throw new UnauthorizedError('Invalid or expired OTP')
  }

  if (otp.attempts >= env.MAX_ATTEMPTS) {
    throw new UnauthorizedError('Maximum OTP attempts exceeded')
  }

  const isValid = await verifyPassword(code, otp.codeHash)

  if (!isValid) {
    await otpRepository.updateOne(
      { id: otp.id },
      { attempts: otp.attempts + 1 },
    )
    throw new UnauthorizedError('Invalid or expired OTP')
  }

  await otpRepository.updateOne({ id: otp.id }, { verifiedAt: new Date() })
}
