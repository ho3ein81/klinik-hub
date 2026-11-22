import { ConflictError, NotFoundError } from '../../utils/errors'
import {
  ClinicContactResponseDto,
  CreateClinicContactRequestDto,
  UpdateClinicContactRequestDto,
} from './clinicContact.dto'
import { toClinicContactResponseDto } from './clinicContact.mapper'
import {
  buildPaginationMeta,
  getPaginationParams,
  PaginationMeta,
} from '../../utils/pagination'
import { withScope } from '../../utils/scope'
import { clinicContactRepository } from './clinicContact.repository'
import { PaginationParams } from '../../types/pagination'
import { clinicRepository } from '../clinics/clinic.repository'

interface GetClinicContactsParams extends PaginationParams {
  clinicId?: string
  authenticatedClinicId?: string
}

export async function getClinicContacts(
  params: GetClinicContactsParams,
): Promise<{ data: ClinicContactResponseDto[]; meta: PaginationMeta }> {
  const { skip, take, page, limit } = getPaginationParams(params as any)

  const where = withScope(
    { ...(params.clinicId && { clinicId: params.clinicId }) },
    params.authenticatedClinicId,
  )

  const { data, total } = await clinicContactRepository.findAll({
    where,
    orderBy: { createdAt: params.sortOrder ?? 'desc' },
    skip,
    take,
  })

  return {
    data: data.map(toClinicContactResponseDto),
    meta: buildPaginationMeta(page, limit, total),
  }
}

export async function createClinicContact(
  data: CreateClinicContactRequestDto,
  authenticatedClinicId?: string,
): Promise<ClinicContactResponseDto> {
  const clinicId = authenticatedClinicId || data.clinicId
  const clinic = await clinicRepository.findById(clinicId)

  if (!clinic) {
    throw new NotFoundError('Clinic not found')
  }

  const clincContact = await clinicContactRepository.findFirst({
    clinicId,
    contactType: data.contactType,
    value: data.value,
  })

  if (clincContact) {
    throw new ConflictError(
      `Clinic contact with type ${data.contactType} and value ${data.value} already exists for this clinic`,
    )
  }

  if (data.isPrimary) {
    await clinicContactRepository.update(
      {
        clinicId: clinicId,
      },
      {
        isPrimary: false,
      },
    )
  }

  const contact = await clinicContactRepository.create({
    clinicId: clinicId,
    name: data.name,
    contactType: data.contactType,
    value: data.value,
    isPrimary: data.isPrimary,
  })

  return toClinicContactResponseDto(contact)
}

export async function getClinicContactById(
  id: string,
  authenticatedClinicId?: string,
): Promise<ClinicContactResponseDto> {
  const where = withScope(
    {
      id,
    },
    authenticatedClinicId,
  )
  const contact = await clinicContactRepository.findFirst(where)

  if (!contact) {
    throw new NotFoundError('Clinic contact not found')
  }

  return toClinicContactResponseDto(contact)
}

export async function updateClinicContact(
  id: string,
  data: UpdateClinicContactRequestDto,
  authenticatedClinicId?: string,
): Promise<ClinicContactResponseDto> {
  const where = withScope(
    {
      id,
    },
    authenticatedClinicId,
  )
  const existingContact = await clinicContactRepository.findFirst(where)

  if (!existingContact) {
    throw new NotFoundError('Clinic contact not found')
  }

  if (data.contactType && data.value) {
    const clincContact = await clinicContactRepository.findFirst({
      id: {
        not: id,
      },
      clinicId: existingContact.clinicId,
      contactType: data.contactType,
      value: data.value,
    })

    if (clincContact) {
      throw new ConflictError(
        `Clinic contact with type ${clincContact.contactType} and value ${clincContact.value} already exists for this clinic`,
      )
    }
  }

  if (data.isPrimary) {
    await clinicContactRepository.update(
      {
        clinicId: existingContact.clinicId,
      },
      {
        isPrimary: false,
      },
    )
  }

  const contact = await clinicContactRepository.updateOne(where, data)

  return toClinicContactResponseDto(contact)
}

export async function deleteClinicContact(
  id: string,
  authenticatedClinicId?: string,
): Promise<void> {
  const where = withScope(
    {
      id,
    },
    authenticatedClinicId,
  )

  const existingContact = await clinicContactRepository.findFirst(where)

  if (!existingContact) {
    throw new NotFoundError('Clinic contact not found')
  }

  await clinicContactRepository.deleteOne(where)
}
