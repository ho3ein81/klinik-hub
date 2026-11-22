import { z } from 'zod'
import { paginationQuerySchema } from '../../validations/pagination'

export const createServiceSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(1000).optional(),
    price: z.coerce.number().positive().optional(),
    duration: z.coerce.number().int().positive().optional(),
    image: z.string().optional(),
    order: z.coerce.number().int().optional(),
  }),
})

export const createAdminServiceSchema = z.object({
  body: z.object({
    clinicId: z.uuid(),
    name: z.string().min(2).max(100),
    description: z.string().max(1000).optional(),
    price: z.coerce.number().positive().optional(),
    duration: z.coerce.number().int().positive().optional(),
    image: z.string().optional(),
    order: z.coerce.number().int().optional(),
  }),
})

export const updateServiceSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(1000).optional(),
    price: z.coerce.number().positive().optional(),
    duration: z.coerce.number().int().positive().optional(),
    image: z.string().optional(),
    order: z.coerce.number().int().optional(),
  }),
})

export const serviceIdSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
})

export const listServicesSchema = z.object({
  query: paginationQuerySchema.extend({
    clinicId: z.uuid().optional(),
    isActive: z.coerce.boolean().optional(),
  }),
})

export const listPublicServicesSchema = z.object({
  query: paginationQuerySchema.extend({
    clinicId: z.uuid(),
  }),
})

export const serviceReadResourcesSchema = z.object({
  params: z.object({
    resourceField: z.string().min(2).max(100),
    resourceValue: z.string().min(2).max(100),
  }),
  query: z.object({
    size: z.enum(['t', 'm']).optional(),
  }),
})
