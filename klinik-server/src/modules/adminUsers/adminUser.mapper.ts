import { AdminUserResponseDto } from './adminUser.dto'

export function toAdminUserResponseDto(adminUser: {
  id: string
  username: string
  email: string | null
  phone: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}): AdminUserResponseDto {
  return {
    id: adminUser.id,
    username: adminUser.username,
    email: adminUser.email,
    phone: adminUser.phone,
    isActive: adminUser.isActive,
    createdAt: adminUser.createdAt,
    updatedAt: adminUser.updatedAt,
  }
}
