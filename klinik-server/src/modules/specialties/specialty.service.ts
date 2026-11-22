import { PaginationParams } from '../../types/pagination'
import { NotFoundError } from '../../utils/errors'
import {
  buildPaginationMeta,
  getPaginationParams,
  PaginationMeta,
} from '../../utils/pagination'
import { withScope } from '../../utils/scope'
import { clinicRepository } from '../clinics/clinic.repository'
import {
  SpecialtyResponseDto,
  CreateSpecialtyRequestDto,
  UpdateSpecialtyRequestDto,
} from './specialty.dto'
import { toSpecialtyResponseDto } from './specialty.mapper'
import { specialtyRepository } from './specialty.repository'

interface GetSpecialtiesParams extends PaginationParams {
  clinicId?: string
  isActive?: boolean
  authenticatedClinicId?: string
}

export async function getSpecialties(
  params: GetSpecialtiesParams,
): Promise<{ data: SpecialtyResponseDto[]; meta: PaginationMeta }> {
  const { skip, take, page, limit } = getPaginationParams(params as any)

  const where = withScope(
    {
      ...(params.clinicId && { clinicId: params.clinicId }),
      ...(params.isActive !== undefined && { isActive: params.isActive }),
    },
    params.authenticatedClinicId,
  )

  const { data, total } = await specialtyRepository.findAll({
    where,
    orderBy: params.sortBy
      ? { [params.sortBy]: params.sortOrder ?? 'desc' }
      : { createdAt: params.sortOrder ?? 'desc' },
    skip,
    take,
  })

  return {
    data: data.map(toSpecialtyResponseDto),
    meta: buildPaginationMeta(page, limit, total),
  }
}

export async function createSpecialty(
  data: CreateSpecialtyRequestDto,
  authenticatedClinicId?: string,
): Promise<SpecialtyResponseDto> {
  const clinicId = authenticatedClinicId || data.clinicId
  const clinic = await clinicRepository.findById(clinicId)

  if (!clinic) {
    throw new NotFoundError('Clinic not found')
  }

  const specialty = await specialtyRepository.create({
    ...data,
    clinicId,
  })

  return toSpecialtyResponseDto(specialty)
}

export async function getSpecialtyById(
  id: string,
  authenticatedClinicId?: string,
): Promise<SpecialtyResponseDto> {
  const where = withScope({ id }, authenticatedClinicId)
  const specialty = await specialtyRepository.findFirst(where)
  if (!specialty) {
    throw new NotFoundError('Specialty not found')
  }

  return toSpecialtyResponseDto(specialty)
}

export async function updateSpecialty(
  id: string,
  data: UpdateSpecialtyRequestDto,
  authenticatedClinicId?: string,
): Promise<SpecialtyResponseDto> {
  const where = withScope({ id }, authenticatedClinicId)

  const existing = await specialtyRepository.findFirst(where)

  if (!existing) {
    throw new NotFoundError('Specialty not found')
  }

  const specialty = await specialtyRepository.updateOne(where, data)

  return toSpecialtyResponseDto(specialty)
}

export async function deleteSpecialty(
  id: string,
  authenticatedClinicId?: string,
): Promise<void> {
  const where = withScope({ id }, authenticatedClinicId)
  const existing = await specialtyRepository.findFirst(where)

  if (!existing) {
    throw new NotFoundError('Specialty not found')
  }

  await specialtyRepository.deleteOne(where)
}

export async function activateSpecialty(
  id: string,
  authenticatedClinicId?: string,
): Promise<SpecialtyResponseDto> {
  const where = withScope({ id }, authenticatedClinicId)
  const existing = await specialtyRepository.findFirst(where)

  if (!existing) {
    throw new NotFoundError('Specialty not found')
  }

  const specialty = await specialtyRepository.updateOne(where, {
    isActive: true,
  })

  return toSpecialtyResponseDto(specialty)
}

export async function deactivateSpecialty(
  id: string,
  authenticatedClinicId?: string,
): Promise<SpecialtyResponseDto> {
  const where = withScope({ id }, authenticatedClinicId)
  const existing = await specialtyRepository.findFirst(where)

  if (!existing) {
    throw new NotFoundError('Specialty not found')
  }

  const specialty = await specialtyRepository.updateOne(where, {
    isActive: false,
  })

  return toSpecialtyResponseDto(specialty)
}
