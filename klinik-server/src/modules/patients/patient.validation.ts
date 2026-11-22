import { z } from 'zod'
import { paginationQuerySchema } from '../../validations/pagination'
import { phoneSchema } from '../../utils/validation'

export const createAdminPatientSchema = z.object({
  body: z.object({
    clinicId: z.uuid(),
    firstName: z.string().min(2).max(100),
    lastName: z.string().min(2).max(100),
    phone: phoneSchema,
    address: z.string().max(255).optional(),
    dateOfBirth: z.coerce.date().optional(),
    avatar: z.string().optional(),
  }),
})

export const createPatientSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).max(100),
    lastName: z.string().min(2).max(100),
    phone: phoneSchema,
    address: z.string().max(255).optional(),
    dateOfBirth: z.coerce.date().optional(),
    avatar: z.string().optional(),
  }),
})

export const updatePatientSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    firstName: z.string().min(2).max(100).optional(),
    lastName: z.string().min(2).max(100).optional(),
    phone: phoneSchema.optional(),
    address: z.string().max(255).optional(),
    dateOfBirth: z.coerce.date().optional(),
    avatar: z.string().optional(),
  }),
})

export const updateMyPatientProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).max(100).optional(),
    lastName: z.string().min(2).max(100).optional(),
    address: z.string().max(255).optional(),
    dateOfBirth: z.coerce.date().optional(),
    avatar: z.string().optional(),
  }),
})

export const patientIdSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
})

export const patientReadResourcesSchema = z.object({
  params: z.object({
    resourceField: z.string().min(2).max(100),
    resourceValue: z.string().min(2).max(100),
  }),
  query: z.object({
    size: z.enum(['t', 'm']).optional(),
  }),
})

export const listPatientsSchema = z.object({
  query: paginationQuerySchema.extend({
    clinicId: z.uuid().optional(),
    // matches firstName, lastName, or phone (see patient.service#buildSearchWhere)
    search: z.string().min(1).max(100).optional(),
  }),
})

export const requestPatientOtpSchema = z.object({
  body: z.object({
    phone: phoneSchema,
  }),
})

export const loginPatientSchema = z.object({
  body: z.object({
    phone: phoneSchema,
    code: z.string().length(6),
  }),
})

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
})
