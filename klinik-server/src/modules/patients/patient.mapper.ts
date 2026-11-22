import { PatientResponseDto } from './patient.dto'

export function toPatientResponseDto(patient: {
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
}): PatientResponseDto {
  return {
    id: patient.id,
    clinicId: patient.clinicId,
    firstName: patient.firstName,
    lastName: patient.lastName,
    phone: patient.phone,
    address: patient.address,
    dateOfBirth: patient.dateOfBirth,
    avatar: patient.avatar,
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
  }
}
