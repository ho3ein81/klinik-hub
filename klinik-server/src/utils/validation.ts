import { z } from 'zod'

export const emailSchema = z.email('Invalid email address')

export const phoneSchema = z
  .string()
  .regex(/^\d{7,15}$/, 'Phone number must contain 7-15 digits')

export const passwordSchema = z.string().min(6)

export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:mm format')

export const durationSlotSchema = z.union([
  z.literal(15),
  z.literal(30),
  z.literal(45),
  z.literal(60),
])

export const timeRangeRefinement = (
  data: { startTime: string; endTime: string },
  ctx: z.RefinementCtx,
) => {
  if (data.startTime >= data.endTime) {
    ctx.addIssue({
      code: 'custom',
      path: ['endTime'],
      message: 'endTime must be later than startTime',
    })
  }
}
