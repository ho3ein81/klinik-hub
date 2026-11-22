import { z } from 'zod'
import { paginationQuerySchema } from '../../validations/pagination'

export const createSpecialtySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(1000).optional(),
  }),
})

export const createAdminSpecialtySchema = z.object({
  body: z.object({
    clinicId: z.uuid(),
    name: z.string().min(2).max(100),
    description: z.string().max(1000).optional(),
  }),
})

export const updateSpecialtySchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(1000).optional(),
  }),
})

export const specialtyIdSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
})

export const listSpecialtiesSchema = z.object({
  query: paginationQuerySchema.extend({
    clinicId: z.uuid().optional(),
    isActive: z.coerce.boolean().optional(),
  }),
})
