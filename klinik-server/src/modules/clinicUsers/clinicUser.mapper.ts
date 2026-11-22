import { ClinicUserType, Specialty } from '@prisma/client'
import { ClinicUserResponseDto, PublicDoctorResponseDto } from './clinicUser.dto'
import { toSpecialtyResponseDto } from '../specialties/specialty.mapper'

export function toClinicUserResponseDto(clinicUser: {
  id: string
  clinicId: string
  email: string
  phone: string | null
  isActive: boolean
  avatar: string | null
  createdAt: Date
  updatedAt: Date
  type: ClinicUserType
  firstName: string
  lastName: string
  specialties?: Specialty[]
}): ClinicUserResponseDto {
  return {
    id: clinicUser.id,
    clinicId: clinicUser.clinicId,
    email: clinicUser.email,
    phone: clinicUser.phone,
    isActive: clinicUser.isActive,
    avatar: clinicUser.avatar,
    createdAt: clinicUser.createdAt,
    updatedAt: clinicUser.updatedAt,
    type: clinicUser.type,
    firstName: clinicUser.firstName,
    lastName: clinicUser.lastName,
    specialties: (clinicUser.specialties ?? []).map(toSpecialtyResponseDto),
  }
}

export function toPublicDoctorResponseDto(clinicUser: {
  id: string
  firstName: string
  lastName: string
  avatar: string | null
  type: ClinicUserType
  specialties?: Specialty[]
}): PublicDoctorResponseDto {
  return {
    id: clinicUser.id,
    firstName: clinicUser.firstName,
    lastName: clinicUser.lastName,
    avatar: clinicUser.avatar,
    type: clinicUser.type,
    specialties: (clinicUser.specialties ?? []).map(toSpecialtyResponseDto),
  }
}
