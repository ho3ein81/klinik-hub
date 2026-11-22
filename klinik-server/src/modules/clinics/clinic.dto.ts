export interface CreateClinicRequestDto {
  name: string
  description?: string
  address?: string
  image?: string
}

export interface UpdateClinicRequestDto {
  name?: string
  description?: string
  address?: string
  image?: string
}

export interface ClinicResponseDto {
  id: string
  name: string
  description: string | null
  address: string | null
  image: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
