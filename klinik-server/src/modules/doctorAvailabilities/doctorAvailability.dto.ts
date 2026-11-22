import { DayOfWeek } from '@prisma/client'

export interface CreateDoctorAvailabilityRequestDto {
  clinicId?: string
  doctorId: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  durationSlot?: number
}

export interface UpdateDoctorAvailabilityRequestDto {
  dayOfWeek?: DayOfWeek
  startTime?: string
  endTime?: string
  durationSlot?: number
}

export interface DoctorAvailabilityResponseDto {
  id: string
  clinicId: string
  doctorId: string
  doctorFirstName?: string
  doctorLastName?: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  isActive: boolean
  durationSlot: number
  createdAt: Date
  updatedAt: Date
}
export interface FindOverlappingDto {
  clinicId: string
  doctorId: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  excludeId?: string
}

export interface GetAvailableSlotsQueryDto {
  doctorId: string
  date: Date | string
}

export interface DoctorSlotResponseDto {
  date: Date | string
  startTime: string
  endTime: string
  doctorId: string
}
