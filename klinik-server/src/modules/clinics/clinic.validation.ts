import { z } from 'zod'
import { paginationQuerySchema } from '../../validations/pagination'

export const createClinicSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    address: z.string().optional(),
    image: z.string().optional(),
  }),
})

export const updateClinicSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    image: z.string().optional(),
  }),
})

export const clinicIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
})

export const listClinicsSchema = z.object({
  query: paginationQuerySchema,
})

export const clinicReadResourcesSchema = z.object({
  params: z.object({
    resourceField: z.string().min(2).max(100),
    resourceValue: z.string().min(2).max(100),
  }),
  query: z.object({
    size: z.enum(['t', 'm']).optional(),
  }),
})
