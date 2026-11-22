import { z } from 'zod'
import { DayOfWeek } from '@prisma/client'
import { paginationQuerySchema } from '../../validations/pagination'
import {
  durationSlotSchema,
  timeRangeRefinement,
  timeSchema,
} from '../../utils/validation'

export const createDoctorAvailabilitySchema = z.object({
  body: z
    .object({
      doctorId: z.uuid(),
      dayOfWeek: z.enum(DayOfWeek),
      startTime: timeSchema,
      endTime: timeSchema,
      durationSlot: durationSlotSchema.optional(),
    })
    .superRefine(timeRangeRefinement),
})

export const createAdminDoctorAvailabilitySchema = z.object({
  body: z
    .object({
      clinicId: z.uuid(),
      doctorId: z.uuid(),
      dayOfWeek: z.enum(DayOfWeek),
      startTime: timeSchema,
      endTime: timeSchema,
      durationSlot: durationSlotSchema.optional(),
    })
    .superRefine(timeRangeRefinement),
})

export const updateDoctorAvailabilitySchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z
    .object({
      dayOfWeek: z.enum(DayOfWeek).optional(),
      startTime: timeSchema.optional(),
      endTime: timeSchema.optional(),
      durationSlot: durationSlotSchema.optional(),
    })
    .superRefine((data, ctx) => {
      if (
        data.startTime !== undefined &&
        data.endTime !== undefined &&
        data.startTime >= data.endTime
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['endTime'],
          message: 'endTime must be later than startTime',
        })
      }
    }),
})

export const doctorAvailabilityIdSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
})

export const listDoctorAvailabilitiesSchema = z.object({
  query: paginationQuerySchema.extend({
    clinicId: z.uuid().optional(),
    doctorId: z.uuid().optional(),
    dayOfWeek: z.enum(DayOfWeek).optional(),
    isActive: z.coerce.boolean().optional(),
  }),
})

export const listPublicDoctorAvailabilitiesSchema = z.object({
  query: z.object({
    doctorId: z.uuid(),
  }),
})

export const getAvailableSlotsSchema = z.object({
  query: z.object({
    doctorId: z.uuid(),
    date: z.coerce.date(),
  }),
})

export const getFirstAvailableSlotSchema = z.object({
  query: z.object({
    doctorId: z.uuid(),
    date: z.coerce.date().optional(), // Defaults to current date if omitted
  }),
})
