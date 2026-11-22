import prisma from '../../db/prisma'
import { unitOfWork } from '../../db/unitOfWork'
import { env } from '../../config/env'
import { PaginationParams } from '../../types/pagination'
import { NotFoundError } from '../../utils/errors'
import {
  buildPaginationMeta,
  getPaginationParams,
  PaginationMeta,
} from '../../utils/pagination'
import { withScope } from '../../utils/scope'
import {
  ClinicResponseDto,
  CreateClinicRequestDto,
  UpdateClinicRequestDto,
} from './clinic.dto'
import { toClinicResponseDto } from './clinic.mapper'
import { clinicRepository } from './clinic.repository'
import { clinicSettingRepository } from '../clinicSettings/clinicSetting.repository'

interface GetClinicsParams extends PaginationParams {
  id?: string
  authenticatedClinicId?: string
}

export async function getClinics(
  params: GetClinicsParams,
): Promise<{ data: ClinicResponseDto[]; meta: PaginationMeta }> {
  const { skip, take, page, limit } = getPaginationParams(params as any)

  const where = withScope(
    { ...(params.id && { id: params.id }) },
    params.authenticatedClinicId,
    'id',
  )

  const { data, total } = await clinicRepository.findAll({
    where,
    orderBy: { createdAt: params.sortOrder ?? 'desc' },
    skip,
    take,
  })

  return {
    data: data.map(toClinicResponseDto),
    meta: buildPaginationMeta(page, limit, total),
  }
}

export async function createClinic(
  data: CreateClinicRequestDto,
): Promise<ClinicResponseDto> {
  // The clinic and its default settings must commit together — a clinic
  // should never exist without a ClinicSetting row to fall back on.
  const clinic = await unitOfWork(async (tx) => {
    const clinic = await clinicRepository.create(
      {
        name: data.name,
        description: data.description,
        address: data.address,
        image: data.image,
      },
      tx,
    )

    await clinicSettingRepository.create(
      {
        clinicId: clinic.id,
        allowPatientBooking: env.DEFAULT_ALLOW_PATIENT_BOOKING,
      },
      tx,
    )

    return clinic
  })

  return toClinicResponseDto(clinic)
}

export async function getClinicById(
  id: string,
  authenticatedClinicId?: string,
): Promise<ClinicResponseDto> {
  const where = withScope(
    {
      id,
    },
    authenticatedClinicId,
    'id',
  )

  const clinic = await clinicRepository.findFirst(where)

  if (!clinic) {
    throw new NotFoundError('Clinic not found')
  }

  return toClinicResponseDto(clinic)
}

export async function updateClinic(
  id: string,
  data: UpdateClinicRequestDto,
  authenticatedClinicId?: string,
): Promise<ClinicResponseDto> {
  const where = withScope(
    {
      id,
    },
    authenticatedClinicId,
    'id',
  )

  const existingClinic = await clinicRepository.findFirst(where)

  if (!existingClinic) {
    throw new NotFoundError('Clinic not found')
  }

  const clinic = await clinicRepository.updateOne(where, data)

  return toClinicResponseDto(clinic)
}

export async function deleteClinic(
  id: string,
  authenticatedClinicId?: string,
): Promise<void> {
  const where = withScope(
    {
      id,
    },
    authenticatedClinicId,
    'id',
  )

  const existingClinic = await clinicRepository.findFirst(where)

  if (!existingClinic) {
    throw new NotFoundError('Clinic not found')
  }

  await clinicRepository.deleteOne(where)
}

export async function activateClinic(
  id: string,
  authenticatedClinicId?: string,
): Promise<ClinicResponseDto> {
  const where = withScope({ id }, authenticatedClinicId)
  const existing = await clinicRepository.findFirst(where)

  if (!existing) {
    throw new NotFoundError('Clinic not found')
  }

  const clinic = await clinicRepository.updateOne(where, {
    isActive: true,
  })

  return toClinicResponseDto(clinic)
}

export async function deactivateClinic(
  id: string,
  authenticatedClinicId?: string,
): Promise<ClinicResponseDto> {
  const where = withScope({ id }, authenticatedClinicId)
  const existing = await clinicRepository.findFirst(where)

  if (!existing) {
    throw new NotFoundError('Clinic not found')
  }

  const clinic = await clinicRepository.updateOne(where, {
    isActive: false,
  })

  return toClinicResponseDto(clinic)
}
