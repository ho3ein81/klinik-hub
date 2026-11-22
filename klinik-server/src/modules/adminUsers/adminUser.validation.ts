import { z } from 'zod'
import { paginationQuerySchema } from '../../validations/pagination'
import {
  emailSchema,
  passwordSchema,
  phoneSchema,
} from '../../utils/validation'

export const loginAdminUserSchema = z.object({
  body: z.object({
    username: z.string().min(1),
    password: passwordSchema,
  }),
})

export const adminUserIdSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
})

export const createAdminUserSchema = z.object({
  body: z.object({
    username: z.string().min(3),
    password: passwordSchema,
    email: emailSchema,
    phone: phoneSchema,
  }),
})

export const updateAdminUserSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    username: z.string().min(3).optional(),
    password: passwordSchema.optional(),
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
  }),
})

export const listAdminUsersSchema = z.object({
  query: paginationQuerySchema,
})
