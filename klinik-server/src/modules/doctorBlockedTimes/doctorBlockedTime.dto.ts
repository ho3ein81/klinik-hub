export interface CreateDoctorBlockedTimeRequestDto {
  clinicId?: string
  doctorId: string
  startDate: string | Date
  endDate: string | Date
  reason?: string
}

export interface DoctorBlockedTimeResponseDto {
  id: string
  clinicId: string
  doctorId: string
  doctorFirstName?: string
  doctorLastName?: string
  startDate: Date
  endDate: Date
  reason: string | null
  createdAt: Date
  updatedAt: Date
}
