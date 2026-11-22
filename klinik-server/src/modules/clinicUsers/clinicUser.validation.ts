import { ClinicUserType } from '@prisma/client'
import { z } from 'zod'
import { paginationQuerySchema } from '../../validations/pagination'
import {
  emailSchema,
  passwordSchema,
  phoneSchema,
} from '../../utils/validation'

// Multipart form submissions (avatar upload) flatten a repeated field to a
// single string when only one value is sent, instead of an array of one.
const specialtyIdsSchema = z.preprocess(
  (value) =>
    value === undefined || value === '' ? undefined : [value].flat(),
  z.array(z.uuid()).optional(),
)

export const createAdminClinicUserSchema = z.object({
  body: z.object({
    clinicId: z.uuid(),
    firstName: z.string().min(2).max(100),
    lastName: z.string().min(2).max(100),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    avatar: z.string().optional(),
    type: z.enum(Object.values(ClinicUserType)),
    specialtyIds: specialtyIdsSchema,
  }),
})

export const createClinicUserSchema = z.object({
  body: z.object({
    email: emailSchema,
    firstName: z.string().min(2).max(100),
    lastName: z.string().min(2).max(100),
    phone: phoneSchema,
    password: passwordSchema,
    avatar: z.string().optional(),
    type: z.enum(Object.values(ClinicUserType)),
    specialtyIds: specialtyIdsSchema,
  }),
})

export const updateClinicUserSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    firstName: z.string().min(2).max(100).optional(),
    lastName: z.string().min(2).max(100).optional(),
    avatar: z.string().optional(),
    type: z.enum(Object.values(ClinicUserType)).optional(),
    specialtyIds: specialtyIdsSchema,
  }),
})

export const clinicUserIdSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
})

export const loginClinicUserSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
  }),
})

export const clinicUserReadResourcesSchema = z.object({
  params: z.object({
    resourceField: z.string().min(2).max(100),
    resourceValue: z.string().min(2).max(100),
  }),
  query: z.object({
    size: z.enum(['t', 'm']).optional(),
  }),
})

export const listUsersSchema = z.object({
  query: paginationQuerySchema.extend({
    clinicId: z.uuid().optional(),
    type: z.enum(Object.values(ClinicUserType)).optional(),
  }),
})

export const listPublicDoctorsSchema = z.object({
  query: paginationQuerySchema.extend({
    clinicId: z.uuid(),
  }),
})

export const listPublicStaffSchema = z.object({
  query: paginationQuerySchema.extend({
    clinicId: z.uuid(),
  }),
})

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
})

export const changeClinicUserPasswordSchema = z.object({
  body: z
    .object({
      currentPassword: passwordSchema,
      newPassword: passwordSchema,
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: 'New password must be different from current password',
      path: ['newPassword'],
    }),
})
