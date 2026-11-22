export interface CreateAdminUserDto {
  username: string
  password: string
  email: string
  phone?: string
  isActive?: boolean
}

export interface UpdateAdminUserDto {
  username?: string
  password?: string
  email?: string
  phone?: string
  isActive?: boolean
}

export interface AdminUserResponseDto {
  id: string
  username: string
  email: string | null
  phone: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface LoginAdminUserDto {
  username: string
  password: string
}

export interface LoginAdminUserResponseDto {
  accessToken: string
  user: AdminUserResponseDto
}
