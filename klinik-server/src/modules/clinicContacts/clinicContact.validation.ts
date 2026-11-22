import { ContactType } from '@prisma/client'
import { z } from 'zod'
import { paginationQuerySchema } from '../../validations/pagination'
import { emailSchema, phoneSchema } from '../../utils/validation'

const contactValueSchema = z
  .object({
    contactType: z.enum(Object.values(ContactType)).optional(),
    value: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.contactType && data.value) {
      const schema =
        data.contactType === ContactType.EMAIL
          ? emailSchema
          : data.contactType === ContactType.PHONE
            ? phoneSchema
            : null

      if (schema && !schema.safeParse(data.value).success) {
        ctx.addIssue({
          code: 'custom',
          path: ['value'],
          message:
            data.contactType === ContactType.EMAIL
              ? 'Invalid email address'
              : 'Invalid phone number',
        })
      }
    }
  })

export const createAdminClinicContactSchema = z.object({
  body: z
    .object({
      clinicId: z.uuid(),
      name: z.string().min(1),
      isPrimary: z.boolean().default(false),
    })
    .and(contactValueSchema),
})

export const createClinicContactSchema = z.object({
  body: z
    .object({
      name: z.string().min(1),
      isPrimary: z.boolean().default(false),
    })
    .and(contactValueSchema),
})

export const updateClinicContactSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z
    .object({
      name: z.string().min(1).optional(),
      isPrimary: z.boolean().optional(),
    })
    .and(contactValueSchema),
})

export const clinicContactIdSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
})

export const listClinicContactsSchema = z.object({
  query: paginationQuerySchema.extend({
    clinicId: z.uuid().optional(),
  }),
})

export const listPublicClinicContactsSchema = z.object({
  query: paginationQuerySchema.extend({
    clinicId: z.uuid(),
  }),
})
