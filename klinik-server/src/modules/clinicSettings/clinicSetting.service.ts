import { NotFoundError } from '../../utils/errors'
import { clinicRepository } from '../clinics/clinic.repository'
import {
  ClinicSettingResponseDto,
  PublicClinicSettingResponseDto,
  UpdateClinicSettingRequestDto,
} from './clinicSetting.dto'
import {
  toClinicSettingResponseDto,
  toPublicClinicSettingResponseDto,
} from './clinicSetting.mapper'
import { env } from '../../config/env'
import { clinicSettingRepository } from './clinicSetting.repository'

export async function getClinicSetting(
  clinicId: string,
): Promise<ClinicSettingResponseDto> {
  const setting = await clinicSettingRepository.findOne({ clinicId })
  if (!setting) {
    throw new NotFoundError('Clinic seeting not found')
  }
  return toClinicSettingResponseDto(setting)
}

export async function updateClinicSetting(
  clinicId: string,
  data: UpdateClinicSettingRequestDto,
): Promise<ClinicSettingResponseDto> {
  const setting = await clinicSettingRepository.updateOne({ clinicId }, data)
  return toClinicSettingResponseDto(setting)
}

export async function getPublicClinicSetting(
  clinicId: string,
): Promise<PublicClinicSettingResponseDto> {
  const clinic = await clinicRepository.findById(clinicId)
  if (!clinic) {
    throw new NotFoundError('Clinic not found')
  }
  const setting = await clinicSettingRepository.findOne({ clinicId })
  if (!setting) {
    throw new NotFoundError('Clinic seeting not found')
  }
  return toPublicClinicSettingResponseDto(setting)
}

export async function isPatientBookingAllowed(
  clinicId: string,
): Promise<boolean> {
  const setting = await clinicSettingRepository.findOne({
    clinicId,
  })
  return setting?.allowPatientBooking ?? env.DEFAULT_ALLOW_PATIENT_BOOKING
}
