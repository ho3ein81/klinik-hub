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
  ServiceResponseDto,
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
} from './service.dto'
import { toServiceResponseDto } from './service.mapper'
import { serviceRepository } from './service.repository'

interface GetServicesParams extends PaginationParams {
  clinicId?: string
  isActive?: boolean
  authenticatedClinicId?: string
}

export async function getServices(
  params: GetServicesParams,
): Promise<{ data: ServiceResponseDto[]; meta: PaginationMeta }> {
  const { skip, take, page, limit } = getPaginationParams(params as any)

  const where = withScope(
    {
      ...(params.clinicId && { clinicId: params.clinicId }),
      ...(params.isActive !== undefined && { isActive: params.isActive }),
    },
    params.authenticatedClinicId,
  )

  const { data, total } = await serviceRepository.findAll({
    where,
    orderBy: params.sortBy
      ? { [params.sortBy]: params.sortOrder ?? 'desc' }
      : { createdAt: params.sortOrder ?? 'desc' },
    skip,
    take,
  })

  return {
    data: data.map(toServiceResponseDto),
    meta: buildPaginationMeta(page, limit, total),
  }
}

export async function createService(
  data: CreateServiceRequestDto,
  authenticatedClinicId?: string,
): Promise<ServiceResponseDto> {
  const clinicId = authenticatedClinicId || data.clinicId
  const clinic = await clinicRepository.findById(clinicId)

  if (!clinic) {
    throw new NotFoundError('Clinic not found')
  }

  const service = await serviceRepository.create({
    ...data,
    clinicId: clinicId,
  })

  return toServiceResponseDto(service)
}

export async function getServiceById(
  id: string,
  authenticatedClinicId?: string,
  isActive?: boolean,
): Promise<ServiceResponseDto> {
  const where = withScope(
    {
      id,
      ...(isActive !== undefined && { isActive: isActive }),
    },
    authenticatedClinicId,
  )
  const service = await serviceRepository.findFirst(where)
  if (!service) {
    throw new NotFoundError('Clinic service not found')
  }

  return toServiceResponseDto(service)
}

export async function getPublicServiceById(
  id: string,
): Promise<ServiceResponseDto> {
  const service = await serviceRepository.findFirst({ id, isActive: true })

  if (!service) {
    throw new NotFoundError('Clinic service not found')
  }

  return toServiceResponseDto(service)
}

export async function updateService(
  id: string,
  data: UpdateServiceRequestDto,
  authenticatedClinicId?: string,
): Promise<ServiceResponseDto> {
  const where = withScope(
    {
      id,
    },
    authenticatedClinicId,
  )

  const existingService = await serviceRepository.findFirst(where)

  if (!existingService) {
    throw new NotFoundError('Clinic service not found')
  }

  const service = await serviceRepository.updateOne(where, data)

  return toServiceResponseDto(service)
}

export async function deleteService(
  id: string,
  authenticatedClinicId?: string,
): Promise<void> {
  const where = withScope(
    {
      id,
    },
    authenticatedClinicId,
  )
  const existingService = await serviceRepository.findFirst(where)

  if (!existingService) {
    throw new NotFoundError('Clinic service not found')
  }

  await serviceRepository.deleteOne(where)
}

export async function activateService(
  id: string,
  authenticatedClinicId?: string,
): Promise<ServiceResponseDto> {
  const where = withScope({ id }, authenticatedClinicId)
  const existing = await serviceRepository.findFirst(where)

  if (!existing) {
    throw new NotFoundError('Clinic service not found')
  }

  const availability = await serviceRepository.updateOne(where, {
    isActive: true,
  })

  return toServiceResponseDto(availability)
}

export async function deactivateService(
  id: string,
  authenticatedClinicId?: string,
): Promise<ServiceResponseDto> {
  const where = withScope({ id }, authenticatedClinicId)
  const existing = await serviceRepository.findFirst(where)

  if (!existing) {
    throw new NotFoundError('Clinic service not found')
  }

  const availability = await serviceRepository.updateOne(where, {
    isActive: false,
  })

  return toServiceResponseDto(availability)
}
