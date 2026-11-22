import { ContactType } from '@prisma/client'
import { ClinicContactResponseDto } from './clinicContact.dto'

export function toClinicContactResponseDto(contact: {
  id: string
  clinicId: string
  name: string
  contactType: ContactType
  value: string
  isPrimary: boolean
  createdAt: Date
  updatedAt: Date
}): ClinicContactResponseDto {
  return {
    id: contact.id,
    clinicId: contact.clinicId,
    name: contact.name,
    contactType: contact.contactType,
    value: contact.value,
    isPrimary: contact.isPrimary,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
  }
}
