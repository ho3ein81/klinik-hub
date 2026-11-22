import { ClinicResponseDto } from './clinic.dto'

export function toClinicResponseDto(clinic: {
  id: string
  name: string
  description: string | null
  address: string | null
  image: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}): ClinicResponseDto {
  return {
    id: clinic.id,
    name: clinic.name,
    description: clinic.description,
    address: clinic.address,
    image: clinic.image,
    isActive: clinic.isActive,
    createdAt: clinic.createdAt,
    updatedAt: clinic.updatedAt,
  }
}
