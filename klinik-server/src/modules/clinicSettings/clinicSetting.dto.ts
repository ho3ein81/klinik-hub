export interface ClinicSettingResponseDto {
  id: string
  clinicId: string
  allowPatientBooking: boolean
  showArticle: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UpdateClinicSettingRequestDto {
  allowPatientBooking?: boolean
  showArticle?: boolean
}

export interface PublicClinicSettingResponseDto {
  clinicId: string
  allowPatientBooking: boolean
  showArticle: boolean
}
