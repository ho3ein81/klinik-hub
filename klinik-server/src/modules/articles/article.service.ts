import { ArticleStatus } from '@prisma/client'
import { PaginationParams } from '../../types/pagination'
import { ConflictError, NotFoundError } from '../../utils/errors'
import {
  buildPaginationMeta,
  getPaginationParams,
  PaginationMeta,
} from '../../utils/pagination'
import { withScope } from '../../utils/scope'
import { clinicRepository } from '../clinics/clinic.repository'
import {
  ArticleResponseDto,
  CreateArticleRequestDto,
  UpdateArticleRequestDto,
} from './article.dto'
import { toArticleResponseDto } from './article.mapper'
import { articleRepository } from './article.repository'

interface GetArticlesParams extends PaginationParams {
  clinicId?: string
  status?: ArticleStatus
  authenticatedClinicId?: string
}

export async function getArticles(
  params: GetArticlesParams,
): Promise<{ data: ArticleResponseDto[]; meta: PaginationMeta }> {
  const { skip, take, page, limit } = getPaginationParams(params as any)

  const where = withScope(
    {
      ...(params.clinicId && { clinicId: params.clinicId }),
      ...(params.status && { status: params.status }),
    },
    params.authenticatedClinicId,
  )

  const { data, total } = await articleRepository.findAll({
    where,
    orderBy: params.sortBy
      ? { [params.sortBy]: params.sortOrder ?? 'desc' }
      : { createdAt: params.sortOrder ?? 'desc' },
    skip,
    take,
  })

  return {
    data: data.map(toArticleResponseDto),
    meta: buildPaginationMeta(page, limit, total),
  }
}

export async function createArticle(
  data: CreateArticleRequestDto,
  authenticatedClinicId?: string,
): Promise<ArticleResponseDto> {
  const clinicId = authenticatedClinicId || data.clinicId

  if (!clinicId) {
    throw new ConflictError('clinicId is required')
  }

  const clinic = await clinicRepository.findById(clinicId)
  if (!clinic) {
    throw new NotFoundError('Clinic not found')
  }

  const article = await articleRepository.create({
    clinicId,
    title: data.title,
    content: data.content,
    image: data.image,
  })

  return toArticleResponseDto(article)
}

export async function getArticleById(
  id: string,
  authenticatedClinicId?: string,
): Promise<ArticleResponseDto> {
  const where = withScope({ id }, authenticatedClinicId)
  const article = await articleRepository.findFirst(where)

  if (!article) {
    throw new NotFoundError('Article not found')
  }

  return toArticleResponseDto(article)
}

export async function getPublicArticleById(
  id: string,
): Promise<ArticleResponseDto> {
  const article = await articleRepository.findFirst({
    id,
    status: ArticleStatus.PUBLISHED,
  })

  if (!article) {
    throw new NotFoundError('Article not found')
  }

  return toArticleResponseDto(article)
}

export async function updateArticle(
  id: string,
  data: UpdateArticleRequestDto,
  authenticatedClinicId?: string,
): Promise<ArticleResponseDto> {
  const where = withScope({ id }, authenticatedClinicId)
  const existing = await articleRepository.findFirst(where)

  if (!existing) {
    throw new NotFoundError('Article not found')
  }

  const article = await articleRepository.updateOne(where, data)

  return toArticleResponseDto(article)
}

export async function deleteArticle(
  id: string,
  authenticatedClinicId?: string,
): Promise<void> {
  const where = withScope({ id }, authenticatedClinicId)
  const existing = await articleRepository.findFirst(where)

  if (!existing) {
    throw new NotFoundError('Article not found')
  }

  await articleRepository.deleteOne(where)
}

export async function publishArticle(
  id: string,
  authenticatedClinicId?: string,
): Promise<ArticleResponseDto> {
  const where = withScope({ id }, authenticatedClinicId)
  const existing = await articleRepository.findFirst(where)

  if (!existing) {
    throw new NotFoundError('Article not found')
  }

  if (existing.status === ArticleStatus.PUBLISHED) {
    throw new ConflictError('article.alreadyPublished')
  }

  const article = await articleRepository.updateOne(where, {
    status: ArticleStatus.PUBLISHED,
  })

  return toArticleResponseDto(article)
}

export async function archiveArticle(
  id: string,
  authenticatedClinicId?: string,
): Promise<ArticleResponseDto> {
  const where = withScope({ id }, authenticatedClinicId)
  const existing = await articleRepository.findFirst(where)

  if (!existing) {
    throw new NotFoundError('Article not found')
  }

  if (existing.status === ArticleStatus.ARCHIVED) {
    throw new ConflictError('article.alreadyArchived')
  }

  const article = await articleRepository.updateOne(where, {
    status: ArticleStatus.ARCHIVED,
  })

  return toArticleResponseDto(article)
}
