import {
  ClinicSettingResponseDto,
  PublicClinicSettingResponseDto,
} from './clinicSetting.dto'

export function toClinicSettingResponseDto(setting: {
  id: string
  clinicId: string
  allowPatientBooking: boolean
  showArticle: boolean
  createdAt: Date
  updatedAt: Date
}): ClinicSettingResponseDto {
  return {
    id: setting.id,
    clinicId: setting.clinicId,
    allowPatientBooking: setting.allowPatientBooking,
    showArticle: setting.showArticle,
    createdAt: setting.createdAt,
    updatedAt: setting.updatedAt,
  }
}

export function toPublicClinicSettingResponseDto(setting: {
  clinicId: string
  allowPatientBooking: boolean
  showArticle: boolean
}): PublicClinicSettingResponseDto {
  return {
    clinicId: setting.clinicId,
    allowPatientBooking: setting.allowPatientBooking,
    showArticle: setting.showArticle,
  }
}
