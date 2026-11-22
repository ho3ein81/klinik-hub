import { ArticleStatus } from '@prisma/client'

export interface CreateArticleRequestDto {
  clinicId?: string // required only when the actor is an admin (not clinic-scoped)
  title: string
  content: string
  image?: string
}

export interface UpdateArticleRequestDto {
  title?: string
  content?: string
  image?: string
}

export interface ArticleResponseDto {
  id: string
  clinicId: string
  title: string
  content: string
  image: string | null
  status: ArticleStatus
  createdAt: Date
  updatedAt: Date
}
