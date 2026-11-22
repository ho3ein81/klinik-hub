import { env } from '../config/env'
import crypto from 'crypto'

export function generateCode(): string {
  const max = 10 ** env.OTP_LENGTH
  return crypto.randomInt(0, max).toString().padStart(env.OTP_LENGTH, '0')
}
