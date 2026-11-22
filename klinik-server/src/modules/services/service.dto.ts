export interface CreateServiceRequestDto {
  clinicId: string
  name: string
  description?: string
  price?: number
  duration?: number
  image?: string
  order?: number
}

export interface UpdateServiceRequestDto {
  name?: string
  description?: string
  price?: number
  duration?: number
  image?: string
  order?: number
}

export interface ServiceResponseDto {
  id: string
  clinicId: string
  name: string
  description: string | null
  price: number | null
  duration: number | null
  image: string | null
  isActive: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}
