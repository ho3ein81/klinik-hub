import { SpecialtyResponseDto } from './specialty.dto'

export function toSpecialtyResponseDto(specialty: {
  id: string
  clinicId: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}): SpecialtyResponseDto {
  return {
    id: specialty.id,
    clinicId: specialty.clinicId,
    name: specialty.name,
    description: specialty.description,
    isActive: specialty.isActive,
    createdAt: specialty.createdAt,
    updatedAt: specialty.updatedAt,
  }
}
