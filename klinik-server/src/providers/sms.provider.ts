import twilio from 'twilio'
import { logger } from '../utils/logger'
import { env } from '../config/env'

export interface SendSmsParams {
  to: string
  message: string
}

export interface ISmsProvider {
  sendSms(params: SendSmsParams): Promise<void>
}

export class TwilioSmsProvider implements ISmsProvider {
  private client: twilio.Twilio | null = null
  private fromNumber: string | undefined

  constructor() {
    const accountSid = env.TWILIO_ACCOUNT_SID
    const authToken = env.TWILIO_AUTH_TOKEN
    this.fromNumber = env.TWILIO_PHONE_NUMBER

    if (accountSid && authToken && this.fromNumber) {
      try {
        this.client = twilio(accountSid, authToken)
        logger.info('Twilio SMS provider initialized successfully.')
      } catch (error) {
        this.client = null
        logger.error(
          'Failed to initialize Twilio client. Falling back to mock mode:',
          error,
        )
      }
    } else {
      logger.warn(
        'Twilio credentials not found in environment variables. SMS provider operating in fallback mode.',
      )
    }
  }

  async sendSms({ to, message }: SendSmsParams): Promise<void> {
    if (this.client && this.fromNumber) {
      try {
        await this.client.messages.create({
          body: message,
          from: this.fromNumber,
          to,
        })
        logger.info(`[Twilio SMS Sent] To: ${to}`)
        return
      } catch (error) {
        logger.error(`Failed to send SMS via Twilio to ${to}:`, error)
        // Log the message so it isn't lost in dev, but still surface the
        // failure to the caller — swallowing it here made every delivery
        // failure look like a success in the notification audit trail.
        logger.info(
          `[Mock SMS Sent (Fallback)] To: ${to} | Content: ${message}`,
        )
        throw error
      }
    }

    // No Twilio credentials configured at all — this is the intentional
    // dev/test fallback, not a delivery failure, so it doesn't throw.
    logger.info(`[Mock SMS Sent] To: ${to} | Content: ${message}`)
  }
}

export const smsProvider = new TwilioSmsProvider()
