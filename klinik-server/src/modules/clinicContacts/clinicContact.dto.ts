import { ContactType } from '@prisma/client'

export interface CreateClinicContactRequestDto {
  clinicId: string
  name: string
  contactType: ContactType
  value: string
  isPrimary: boolean
}

export interface UpdateClinicContactRequestDto {
  name?: string
  contactType?: ContactType
  value?: string
  isPrimary?: boolean
}

export interface ClinicContactResponseDto {
  id: string
  clinicId: string
  name: string
  contactType: ContactType
  value: string
  createdAt: Date
  updatedAt: Date
  isPrimary: boolean
}
