import { z } from 'zod'
import { paginationQuerySchema } from '../../validations/pagination'
import {
  phoneSchema,
  timeRangeRefinement,
  timeSchema,
} from '../../utils/validation'
import { AppointmentStatus } from '@prisma/client'

export const requestAppointmentOtpSchema = z.object({
  body: z.object({
    phone: phoneSchema,
  }),
})

export const bookAppointmentAnonymousSchema = z.object({
  body: z
    .object({
      phone: phoneSchema,
      code: z.string().length(6),
      firstName: z.string().min(2).max(100),
      lastName: z.string().min(2).max(100),
      dateOfBirth: z.coerce.date().optional(),
      clinicId: z.uuid(),
      doctorId: z.uuid(),
      subject: z.string().max(200).optional(),
      description: z.string().max(2000).optional(),
      date: z.coerce.date(),
      startTime: timeSchema,
      endTime: timeSchema,
    })
    .superRefine(timeRangeRefinement),
})

export const bookAppointmentAsPatientSchema = z.object({
  body: z.object({
    doctorId: z.uuid(),
    subject: z.string().max(200).optional(),
    description: z.string().max(2000).optional(),
    date: z.coerce.date(),
    startTime: timeSchema,
    endTime: timeSchema,
  }),
})

// Shared "must provide patientId, or enough details to create one" check
// used by both the clinicUser and admin create schemas below.
function requirePatientOrDetails(
  data: {
    patientId?: string
    firstName?: string
    lastName?: string
    phone?: string
  },
  ctx: z.RefinementCtx,
): void {
  if (!data.patientId && !(data.firstName && data.lastName && data.phone)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Provide either patientId or firstName, lastName and phone',
      path: ['patientId'],
    })
  }
}

export const createAppointmentSchema = z.object({
  body: z
    .object({
      patientId: z.uuid().optional(),
      firstName: z.string().min(2).max(100).optional(),
      lastName: z.string().min(2).max(100).optional(),
      phone: phoneSchema.optional(),
      dateOfBirth: z.coerce.date().optional(),
      doctorId: z.uuid(),
      subject: z.string().max(200).optional(),
      description: z.string().max(2000).optional(),
      date: z.coerce.date(),
      startTime: timeSchema,
      endTime: timeSchema,
    })
    .superRefine(requirePatientOrDetails),
})

export const createAdminAppointmentSchema = z.object({
  body: z
    .object({
      clinicId: z.uuid(),
      patientId: z.uuid().optional(),
      firstName: z.string().min(2).max(100).optional(),
      lastName: z.string().min(2).max(100).optional(),
      phone: phoneSchema.optional(),
      dateOfBirth: z.coerce.date().optional(),
      doctorId: z.uuid(),
      subject: z.string().max(200).optional(),
      description: z.string().max(2000).optional(),
      date: z.coerce.date(),
      startTime: timeSchema,
      endTime: timeSchema,
    })
    .superRefine(requirePatientOrDetails),
})

export const appointmentIdSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
})

export const rejectAppointmentSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    reason: z.string().max(500).optional(),
  }),
})

export const cancelAppointmentSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    reason: z.string().max(500).optional(),
  }),
})

export const rescheduleAppointmentSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z
    .object({
      date: z.coerce.date(),
      startTime: timeSchema,
      endTime: timeSchema,
    })
    .superRefine(timeRangeRefinement),
})

export const listAppointmentsSchema = z.object({
  query: paginationQuerySchema.extend({
    clinicId: z.uuid().optional(),
    doctorId: z.uuid().optional(),
    patientId: z.uuid().optional(),
    status: z.enum(AppointmentStatus).optional(),
    date: z.coerce.date().optional(),
  }),
})

export const getAppointmentStatisticsSchema = z.object({
  query: z.object({
    clinicId: z.uuid().optional(),
    from: z.coerce.date(),
    to: z.coerce.date(),
  }),
})
