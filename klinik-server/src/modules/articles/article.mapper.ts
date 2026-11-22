import { ArticleStatus } from '@prisma/client'
import { ArticleResponseDto } from './article.dto'

export function toArticleResponseDto(article: {
  id: string
  clinicId: string
  title: string
  content: string
  image: string | null
  status: ArticleStatus
  createdAt: Date
  updatedAt: Date
}): ArticleResponseDto {
  return {
    id: article.id,
    clinicId: article.clinicId,
    title: article.title,
    content: article.content,
    image: article.image,
    status: article.status,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
  }
}
