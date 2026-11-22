import { int } from 'zod'

export interface CreatePatientRequestDto {
  clinicId: string
  firstName: string
  lastName: string
  phone: string
  address?: string
  dateOfBirth?: Date | string
  avatar?: string
}

export interface UpdatePatientRequestDto {
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  dateOfBirth?: Date | string
  avatar?: string
}

export interface PatientResponseDto {
  id: string
  clinicId: string
  firstName: string
  lastName: string
  phone: string
  address: string | null
  dateOfBirth: Date | null
  avatar: string | null
  createdAt: Date
  updatedAt: Date
}

export interface RequestPatientOtpRequestDto {
  phone: string
}

export interface LoginPatientRequestDto {
  phone: string
  code: string
}

export interface LoginPatientResponseDto {
  accessToken: string
  refreshToken: string
  patient: PatientResponseDto
}

export interface RefreshPatientTokenRequestDto {
  refreshToken: string
}

export interface RefreshPatientTokenResponseDto {
  accessToken: string
  refreshToken: string
}

export interface ResolveOrCreatePatientDto {
  clinicId: string
  patientId?: string
  firstName?: string
  lastName?: string
  phone?: string
  dateOfBirth?: Date | string
}
