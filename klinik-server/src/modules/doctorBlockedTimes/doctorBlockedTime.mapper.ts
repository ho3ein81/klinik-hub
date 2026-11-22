import { DoctorBlockedTimeResponseDto } from './doctorBlockedTime.dto'

export function toDoctorBlockedTimeResponseDto(blockedTime: {
  id: string
  clinicId: string
  doctorId: string
  startDate: Date
  endDate: Date
  reason: string | null
  createdAt: Date
  updatedAt: Date
  // Present only when the query used `include: { doctor: true }`.
  doctor?: { firstName: string; lastName: string } | null
}): DoctorBlockedTimeResponseDto {
  return {
    id: blockedTime.id,
    clinicId: blockedTime.clinicId,
    doctorId: blockedTime.doctorId,
    doctorFirstName: blockedTime.doctor?.firstName,
    doctorLastName: blockedTime.doctor?.lastName,
    startDate: blockedTime.startDate,
    endDate: blockedTime.endDate,
    reason: blockedTime.reason,
    createdAt: blockedTime.createdAt,
    updatedAt: blockedTime.updatedAt,
  }
}
