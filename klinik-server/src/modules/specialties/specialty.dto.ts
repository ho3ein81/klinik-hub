export interface CreateSpecialtyRequestDto {
  clinicId: string
  name: string
  description?: string
}

export interface UpdateSpecialtyRequestDto {
  name?: string
  description?: string
}

export interface SpecialtyResponseDto {
  id: string
  clinicId: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
