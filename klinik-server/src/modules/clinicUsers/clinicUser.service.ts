import { ClinicUserType } from '@prisma/client'
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../utils/errors'
import {
  AuthTokenPayload,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt'
import { hashPassword, verifyPassword } from '../../utils/password'
import {
  ClinicUserResponseDto,
  CreateClinicUserRequestDto,
  LoginClinicUserRequestDto,
  LoginClinicUserResponseDto,
  PublicDoctorResponseDto,
  RefreshTokenResponseDto,
  UpdateClinicUserRequestDto,
} from './clinicUser.dto'
import {
  toClinicUserResponseDto,
  toPublicDoctorResponseDto,
} from './clinicUser.mapper'
import { PaginationParams } from '../../types/pagination'
import { withScope } from '../../utils/scope'
import {
  buildPaginationMeta,
  getPaginationParams,
  PaginationMeta,
} from '../../utils/pagination'
import {
  clinicUserRepository,
  ClinicUserWithSpecialties,
} from './clinicUser.repository'
import { clinicRepository } from '../clinics/clinic.repository'
import { specialtyRepository } from '../specialties/specialty.repository'

interface GetClinicUsersParams extends PaginationParams {
  clinicId?: string
  type?: ClinicUserType
  isActive?: boolean
  authenticatedClinicId?: string
}

export async function getClinicUsers(
  params: GetClinicUsersParams,
): Promise<{ data: ClinicUserResponseDto[]; meta: PaginationMeta }> {
  const { skip, take, page, limit } = getPaginationParams(params as any)

  const where = withScope(
    {
      ...(params.clinicId && { clinicId: params.clinicId }),
      ...(params.type && { type: params.type }),
      ...(params.isActive !== undefined && { isActive: params.isActive }),
    },
    params.authenticatedClinicId,
  )

  const { data, total } =
    await clinicUserRepository.findAll<ClinicUserWithSpecialties>({
      where,
      orderBy: { createdAt: params.sortOrder ?? 'desc' },
      skip,
      take,
      include: { specialties: true },
    })

  return {
    data: data.map(toClinicUserResponseDto),
    meta: buildPaginationMeta(page, limit, total),
  }
}

export async function getPublicDoctors(
  params: PaginationParams & { clinicId: string },
): Promise<{ data: PublicDoctorResponseDto[]; meta: PaginationMeta }> {
  const { skip, take, page, limit } = getPaginationParams(params as any)

  const { data, total } =
    await clinicUserRepository.findAll<ClinicUserWithSpecialties>({
      where: {
        clinicId: params.clinicId,
        type: ClinicUserType.DOCTOR,
        isActive: true,
      },
      orderBy: { createdAt: params.sortOrder ?? 'desc' },
      skip,
      take,
      include: { specialties: true },
    })

  return {
    data: data.map(toPublicDoctorResponseDto),
    meta: buildPaginationMeta(page, limit, total),
  }
}

// Non-doctor, non-admin staff (nurses, receptionists) shown in a separate
// "team" section — admins are never exposed to anonymous site visitors.
export async function getPublicStaff(
  params: PaginationParams & { clinicId: string },
): Promise<{ data: PublicDoctorResponseDto[]; meta: PaginationMeta }> {
  const { skip, take, page, limit } = getPaginationParams(params as any)

  const { data, total } =
    await clinicUserRepository.findAll<ClinicUserWithSpecialties>({
      where: {
        clinicId: params.clinicId,
        type: { in: [ClinicUserType.NURSE, ClinicUserType.RECEPTIONIST] },
        isActive: true,
      },
      orderBy: { createdAt: params.sortOrder ?? 'desc' },
      skip,
      take,
      include: { specialties: true },
    })

  return {
    data: data.map(toPublicDoctorResponseDto),
    meta: buildPaginationMeta(page, limit, total),
  }
}

async function resolveSpecialtyConnections(
  specialtyIds: string[],
  clinicId: string,
  effectiveType: ClinicUserType | undefined,
): Promise<{ id: string }[]> {
  if (specialtyIds.length === 0) {
    return []
  }

  if (effectiveType !== ClinicUserType.DOCTOR) {
    throw new ForbiddenError('clinicUser.specialtyDoctorOnly')
  }

  const { data: specialties } = await specialtyRepository.findAll({
    where: { id: { in: specialtyIds }, clinicId },
  })

  if (specialties.length !== specialtyIds.length) {
    throw new NotFoundError('Specialty not found')
  }

  return specialtyIds.map((id) => ({ id }))
}

export async function createClinicUser(
  data: CreateClinicUserRequestDto,
  authenticatedClinicId?: string,
): Promise<ClinicUserResponseDto> {
  const clinicId = authenticatedClinicId || data.clinicId

  const clinic = await clinicRepository.findById(clinicId)

  if (!clinic) {
    throw new NotFoundError('Clinic not found')
  }

  const existingUser = await clinicUserRepository.findFirst({
    email: data.email,
  })

  if (existingUser) {
    throw new ConflictError('Clinic user with this email already exists')
  }

  const passwordHash = await hashPassword(data.password)

  const specialtyConnections = await resolveSpecialtyConnections(
    data.specialtyIds ?? [],
    clinicId,
    data.type,
  )

  const clinicUser = await clinicUserRepository.create({
    clinicId: clinicId,
    email: data.email,
    phone: data.phone,
    passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
    avatar: data.avatar,
    type: data.type,
    ...(specialtyConnections.length > 0 && {
      specialties: { connect: specialtyConnections },
    }),
  })

  const created =
    await clinicUserRepository.findById<ClinicUserWithSpecialties>(
      clinicUser.id,
      { include: { specialties: true } },
    )

  return toClinicUserResponseDto(created ?? clinicUser)
}

export async function getClinicUserById(
  id: string,
  authenticatedClinicId?: string,
): Promise<ClinicUserResponseDto> {
  const where = withScope(
    {
      id,
    },
    authenticatedClinicId,
  )

  const clinicUser =
    await clinicUserRepository.findFirst<ClinicUserWithSpecialties>(where, {
      include: { specialties: true },
    })

  if (!clinicUser) {
    throw new NotFoundError('Clinic user not found')
  }

  return toClinicUserResponseDto(clinicUser)
}

export async function updateClinicUser(
  id: string,
  data: UpdateClinicUserRequestDto,
  authenticatedClinicId?: string,
  callerType?: ClinicUserType,
): Promise<ClinicUserResponseDto> {
  const where = withScope(
    {
      id,
    },
    authenticatedClinicId,
  )

  const existingUser = await clinicUserRepository.findFirst(where)

  if (!existingUser) {
    throw new NotFoundError('Clinic user not found')
  }

  if (data.type !== undefined && callerType !== ClinicUserType.ADMIN) {
    throw new ForbiddenError('clinicUser.typeChangeForbidden')
  }

  if (data.email && data.email !== existingUser.email) {
    const emailExists = await clinicUserRepository.findFirst({
      email: data.email,
    })

    if (emailExists) {
      throw new ConflictError('Clinic user with this email already exists')
    }
  }

  const updateData: {
    type?: ClinicUserType
    email?: string
    phone?: string
    passwordHash?: string
    avatar?: string
    firstName?: string
    lastName?: string
    specialties?: { set: { id: string }[] }
  } = {}

  if (data.email !== undefined) {
    updateData.email = data.email
  }

  if (data.phone !== undefined) {
    updateData.phone = data.phone
  }

  if (data.password !== undefined) {
    updateData.passwordHash = await hashPassword(data.password)
  }

  if (data.avatar !== undefined) {
    updateData.avatar = data.avatar
  }

  if (data.firstName !== undefined) {
    updateData.firstName = data.firstName
  }

  if (data.lastName !== undefined) {
    updateData.lastName = data.lastName
  }

  if (data.type !== undefined) {
    updateData.type = data.type
  }

  if (data.specialtyIds !== undefined) {
    const effectiveType = data.type ?? existingUser.type
    const specialtyConnections = await resolveSpecialtyConnections(
      data.specialtyIds,
      existingUser.clinicId,
      effectiveType,
    )
    updateData.specialties = { set: specialtyConnections }
  }

  await clinicUserRepository.updateOne(where, updateData)

  const clinicUser =
    await clinicUserRepository.findFirst<ClinicUserWithSpecialties>(where, {
      include: { specialties: true },
    })

  return toClinicUserResponseDto(clinicUser!)
}

export async function deleteClinicUser(
  id: string,
  authenticatedClinicId?: string,
): Promise<void> {
  const where = withScope(
    {
      id,
    },
    authenticatedClinicId,
  )
  const existingUser = await clinicUserRepository.findFirst(where)

  if (!existingUser) {
    throw new NotFoundError('Clinic user not found')
  }

  await clinicUserRepository.deleteOne(where)
}

export async function loginClinicUser(
  data: LoginClinicUserRequestDto,
): Promise<LoginClinicUserResponseDto> {
  const clinicUser = await clinicUserRepository.findFirst({
    email: data.email,
  })

  if (!clinicUser || !clinicUser.isActive) {
    throw new UnauthorizedError('Invalid email or password')
  }

  const passwordValid = await verifyPassword(
    data.password,
    clinicUser.passwordHash,
  )

  if (!passwordValid) {
    throw new UnauthorizedError('Invalid email or password')
  }

  const accessToken = generateAccessToken(clinicUser.id, 'clinicUser')
  const refreshToken = generateRefreshToken(clinicUser.id, 'clinicUser')

  return {
    accessToken,
    refreshToken,
    user: toClinicUserResponseDto(clinicUser),
  }
}

export async function refreshClinicUserToken(
  refreshToken: string,
): Promise<RefreshTokenResponseDto> {
  let payload: AuthTokenPayload

  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token')
  }

  if (payload.userType !== 'clinicUser') {
    throw new UnauthorizedError('Invalid refresh token')
  }

  const clinicUser = await clinicUserRepository.findFirst({
    id: payload.userId,
  })

  if (!clinicUser || !clinicUser.isActive) {
    throw new UnauthorizedError('Clinic user is inactive or does not exist')
  }

  const accessToken = generateAccessToken(clinicUser.id, 'clinicUser')

  const newRefreshToken = generateRefreshToken(clinicUser.id, 'clinicUser')

  return {
    accessToken,
    refreshToken: newRefreshToken,
  }
}

export async function changeClinicUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const clinicUser = await clinicUserRepository.findFirst({
    id: userId,
  })

  if (!clinicUser) {
    throw new NotFoundError('Clinic user not found')
  }

  if (!clinicUser.isActive) {
    throw new UnauthorizedError('Clinic user is inactive')
  }

  const passwordValid = await verifyPassword(
    currentPassword,
    clinicUser.passwordHash,
  )

  if (!passwordValid) {
    throw new UnauthorizedError('Current password is incorrect')
  }

  const passwordHash = await hashPassword(newPassword)

  await clinicUserRepository.updateOne({ id: userId }, { passwordHash })
}

export async function activateClinicUser(
  id: string,
  authenticatedClinicId?: string,
): Promise<ClinicUserResponseDto> {
  const where = withScope({ id }, authenticatedClinicId)
  const existing = await clinicUserRepository.findFirst(where)

  if (!existing) {
    throw new NotFoundError('User not found')
  }

  const clinicUser = await clinicUserRepository.updateOne(where, {
    isActive: true,
  })

  return toClinicUserResponseDto(clinicUser)
}

export async function deactivateClinicUser(
  id: string,
  authenticatedClinicId?: string,
): Promise<ClinicUserResponseDto> {
  const where = withScope({ id }, authenticatedClinicId)
  const existing = await clinicUserRepository.findFirst(where)

  if (!existing) {
    throw new NotFoundError('User not found')
  }

  const clinicUser = await clinicUserRepository.updateOne(where, {
    isActive: false,
  })

  return toClinicUserResponseDto(clinicUser)
}
