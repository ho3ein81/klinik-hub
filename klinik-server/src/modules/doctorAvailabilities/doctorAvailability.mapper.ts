import { DayOfWeek } from '@prisma/client'
import { DoctorAvailabilityResponseDto } from './doctorAvailability.dto'

export function toDoctorAvailabilityResponseDto(availability: {
  id: string
  clinicId: string
  doctorId: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  isActive: boolean
  durationSlot: number
  createdAt: Date
  updatedAt: Date
  // Present only when the query used `include: { doctor: true }`.
  doctor?: { firstName: string; lastName: string } | null
}): DoctorAvailabilityResponseDto {
  return {
    id: availability.id,
    clinicId: availability.clinicId,
    doctorId: availability.doctorId,
    doctorFirstName: availability.doctor?.firstName,
    doctorLastName: availability.doctor?.lastName,
    dayOfWeek: availability.dayOfWeek,
    startTime: availability.startTime,
    endTime: availability.endTime,
    isActive: availability.isActive,
    durationSlot: availability.durationSlot,
    createdAt: availability.createdAt,
    updatedAt: availability.updatedAt,
  }
}
