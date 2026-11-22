import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.coerce.number().int().positive().default(5000),

  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  UPLOADS_PATH: z.string().default('uploads/'),

  OTP_LENGTH: z.coerce.number().default(6),
  OTP_TTL_MINUTES: z.coerce.number().default(5),
  MAX_ATTEMPTS: z.coerce.number().default(3),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().default(60),

  TWILIO_ACCOUNT_SID: z.string(),
  TWILIO_AUTH_TOKEN: z.string(),
  TWILIO_PHONE_NUMBER: z.string(),
  DEFAULT_ALLOW_PATIENT_BOOKING: z.coerce.boolean().default(true),

  // Bootstrap platform admin, created on first boot against an empty database
  // (see jobs/createInitialAdminUser). The defaults keep local development
  // working out of the box; any internet-facing deployment must override both,
  // because this account administers every clinic.
  INITIAL_ADMIN_USERNAME: z.string().min(3).default('klinik'),
  INITIAL_ADMIN_PASSWORD: z.string().min(8).default('klinik123'),

  // Comma-separated list of browser origins allowed to call the API. Left
  // unset it allows every origin, which is what local development wants.
  CORS_ORIGINS: z.string().optional(),
})

export const env = envSchema.parse(process.env)
