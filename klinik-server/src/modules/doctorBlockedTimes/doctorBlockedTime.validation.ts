import { z } from 'zod'
import { paginationQuerySchema } from '../../validations/pagination'

const dateRangeRefinement = (
  data: { startDate: Date; endDate: Date },
  ctx: z.RefinementCtx,
): void => {
  if (data.startDate >= data.endDate) {
    ctx.addIssue({
      code: 'custom',
      path: ['endDate'],
      message: 'endDate must be later than startDate',
    })
  }
}

export const createDoctorBlockedTimeSchema = z.object({
  body: z
    .object({
      doctorId: z.uuid(),
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      reason: z.string().max(500).optional(),
    })
    .superRefine(dateRangeRefinement),
})

export const createAdminDoctorBlockedTimeSchema = z.object({
  body: z
    .object({
      clinicId: z.uuid(),
      doctorId: z.uuid(),
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      reason: z.string().max(500).optional(),
    })
    .superRefine(dateRangeRefinement),
})

export const doctorBlockedTimeIdSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
})

export const listDoctorBlockedTimesSchema = z.object({
  query: paginationQuerySchema.extend({
    clinicId: z.uuid().optional(),
    doctorId: z.uuid().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }),
})
