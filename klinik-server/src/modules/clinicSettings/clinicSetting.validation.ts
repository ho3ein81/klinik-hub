import { z } from 'zod'

export const updateClinicSettingSchema = z.object({
  body: z.object({
    allowPatientBooking: z.boolean().optional(),
    showArticle: z.boolean().optional(),
  }),
})

export const publicClinicSettingSchema = z.object({
  params: z.object({
    clinicId: z.uuid(),
  }),
})

export const adminClinicSettingParamsSchema = z.object({
  params: z.object({
    clinicId: z.uuid(),
  }),
})

export const updateAdminClinicSettingSchema = z.object({
  params: z.object({
    clinicId: z.uuid(),
  }),
  body: z.object({
    allowPatientBooking: z.boolean().optional(),
    showArticle: z.boolean().optional(),
  }),
})
