import { z } from 'zod'
import { ArticleStatus } from '@prisma/client'
import { paginationQuerySchema } from '../../validations/pagination'

export const createArticleSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(200),
    content: z.string().min(1).max(20000),
    image: z.string().optional(),
  }),
})

export const createAdminArticleSchema = z.object({
  body: z.object({
    clinicId: z.uuid(),
    title: z.string().min(2).max(200),
    content: z.string().min(1).max(20000),
    image: z.string().optional(),
  }),
})

export const updateArticleSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    title: z.string().min(2).max(200).optional(),
    content: z.string().min(1).max(20000).optional(),
    image: z.string().optional(),
  }),
})

export const articleIdSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
})

export const listArticlesSchema = z.object({
  query: paginationQuerySchema.extend({
    clinicId: z.uuid().optional(),
    status: z.enum(ArticleStatus).optional(),
  }),
})

export const listPublicArticlesSchema = z.object({
  query: paginationQuerySchema.extend({
    clinicId: z.uuid(),
  }),
})

export const articleReadResourcesSchema = z.object({
  params: z.object({
    resourceField: z.string().min(2).max(100),
    resourceValue: z.string().min(2).max(100),
  }),
  query: z.object({
    size: z.enum(['t', 'm']).optional(),
  }),
})
