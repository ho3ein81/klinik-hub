import { ClinicUserType } from '@prisma/client'
import { SpecialtyResponseDto } from '../specialties/specialty.dto'

export interface CreateClinicUserRequestDto {
  clinicId: string
  email: string
  phone?: string
  password: string
  isActive?: boolean
  avatar?: string
  type: ClinicUserType
  firstName: string
  lastName: string
  specialtyIds?: string[]
}

export interface UpdateClinicUserRequestDto {
  email?: string
  phone?: string
  password?: string
  isActive?: boolean
  avatar?: string
  type?: ClinicUserType
  firstName?: string
  lastName?: string
  specialtyIds?: string[]
}

export interface LoginClinicUserRequestDto {
  email: string
  password: string
}

export interface ClinicUserResponseDto {
  id: string
  clinicId: string
  email: string
  phone: string | null
  isActive: boolean
  type: ClinicUserType
  avatar: string | null
  createdAt: Date
  updatedAt: Date
  firstName: string
  lastName: string
  specialties: SpecialtyResponseDto[]
}

// Shown to anonymous site visitors — no email/phone.
export interface PublicDoctorResponseDto {
  id: string
  firstName: string
  lastName: string
  avatar: string | null
  type: ClinicUserType
  specialties: SpecialtyResponseDto[]
}

export interface LoginClinicUserResponseDto {
  accessToken: string
  refreshToken: string
  user: ClinicUserResponseDto
}

export interface RefreshTokenRequestDto {
  refreshToken: string
}

export interface RefreshTokenResponseDto {
  accessToken: string
  refreshToken: string
}

export interface ChangeClinicUserPasswordRequestDto {
  currentPassword: string
  newPassword: string
}
