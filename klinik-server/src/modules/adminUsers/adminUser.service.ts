import prisma from '../../db/prisma'
import { PaginationParams } from '../../types/pagination'
import {
  UnauthorizedError,
  NotFoundError,
  ConflictError,
} from '../../utils/errors'
import { generateAccessToken } from '../../utils/jwt'
import {
  buildPaginationMeta,
  getPaginationParams,
  PaginationMeta,
} from '../../utils/pagination'
import { hashPassword, verifyPassword } from '../../utils/password'
import {
  CreateAdminUserDto,
  UpdateAdminUserDto,
  AdminUserResponseDto,
  LoginAdminUserDto,
  LoginAdminUserResponseDto,
} from './adminUser.dto'
import { toAdminUserResponseDto } from './adminUser.mapper'
import { adminUserRepository } from './adminUser.repository'

export async function getAdminUsers(
  params: PaginationParams,
): Promise<{ data: AdminUserResponseDto[]; meta: PaginationMeta }> {
  const { skip, take, page, limit } = getPaginationParams(params as any)

  const { data, total } = await adminUserRepository.findAll({
    orderBy: { createdAt: params.sortOrder ?? 'desc' },
    skip,
    take,
  })

  return {
    data: data.map(toAdminUserResponseDto),
    meta: buildPaginationMeta(page, limit, total),
  }
}

export async function loginAdminUser(
  data: LoginAdminUserDto,
): Promise<LoginAdminUserResponseDto> {
  const adminUser = await adminUserRepository.findOne({
    username: data.username,
  })
  if (!adminUser || !adminUser.isActive) {
    throw new UnauthorizedError('Invalid username or password')
  }
  const passwordValid = await verifyPassword(
    data.password,
    adminUser.passwordHash,
  )
  if (!passwordValid) {
    throw new UnauthorizedError('Invalid username or password')
  }
  const accessToken = generateAccessToken(adminUser.id, 'adminUser')
  return {
    accessToken,
    user: toAdminUserResponseDto(adminUser),
  }
}

export async function getAdminUserById(
  id: string,
): Promise<AdminUserResponseDto> {
  const adminUser = await adminUserRepository.findById(id)
  if (!adminUser) {
    throw new NotFoundError('Admin user not found')
  }

  return toAdminUserResponseDto(adminUser)
}

export async function createAdminUser(data: CreateAdminUserDto) {
  const exists = await adminUserRepository.findOne({
    email: data.email,
  })
  if (exists) {
    throw new ConflictError('Admin user already exists')
  }
  const passwordHash = await hashPassword(data.password)

  const user = await adminUserRepository.create({
    username: data.username,
    passwordHash,
    email: data.email,
    phone: data.phone,
    isActive: data.isActive ?? true,
  })
  return toAdminUserResponseDto(user)
}

export async function updateAdminUser(id: string, data: UpdateAdminUserDto) {
  const user = await adminUserRepository.findById(id)
  if (!user) {
    throw new NotFoundError('Admin user not found')
  }
  const updateData: any = {}

  if (data.username) updateData.username = data.username
  if (data.email) updateData.email = data.email
  if (data.phone) updateData.phone = data.phone
  if (data.isActive !== undefined) updateData.isActive = data.isActive
  if (data.password) {
    updateData.passwordHash = await hashPassword(data.password)
  }
  const updated = await adminUserRepository.updateById(id, updateData)
  return toAdminUserResponseDto(updated)
}

export async function deleteAdminUser(id: string) {
  const user = await adminUserRepository.findById(id)
  if (!user) {
    throw new NotFoundError('Admin user not found')
  }
  await adminUserRepository.deleteById(id)
}

export async function activateAdminUser(
  id: string,
): Promise<AdminUserResponseDto> {
  const existing = await adminUserRepository.findById(id)

  if (!existing) {
    throw new NotFoundError('User not found')
  }

  const adminUser = await adminUserRepository.updateById(id, {
    isActive: true,
  })

  return toAdminUserResponseDto(adminUser)
}

export async function deactivateAdminUser(
  id: string,
): Promise<AdminUserResponseDto> {
  const existing = await adminUserRepository.findById(id)

  if (!existing) {
    throw new NotFoundError('User not found')
  }

  const adminUser = await adminUserRepository.updateById(id, {
    isActive: false,
  })

  return toAdminUserResponseDto(adminUser)
}
