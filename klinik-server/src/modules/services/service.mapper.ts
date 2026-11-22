import { Prisma } from '@prisma/client'
import { ServiceResponseDto } from './service.dto'

export function toServiceResponseDto(service: {
  id: string
  clinicId: string
  name: string
  description: string | null
  price: Prisma.Decimal | null
  duration: number | null
  image: string | null
  isActive: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}): ServiceResponseDto {
  return {
    id: service.id,
    clinicId: service.clinicId,
    name: service.name,
    description: service.description,
    price: service.price !== null ? Number(service.price) : null,
    duration: service.duration,
    image: service.image,
    isActive: service.isActive,
    order: service.order,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  }
}
