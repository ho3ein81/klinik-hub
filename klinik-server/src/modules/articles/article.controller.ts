import { Request, Response } from 'express'
import { ArticleStatus } from '@prisma/client'
import {
  archiveArticle,
  createArticle,
  deleteArticle,
  getArticleById,
  getArticles,
  getPublicArticleById,
  publishArticle,
  updateArticle,
} from './article.service'
import { getParam } from '../../utils/request'
import { sendPaginated, successResponse } from '../../utils/response'
import { feedFile } from '../../utils/feedFile'
import { env } from '../../config/env'

export async function create(req: Request, res: Response): Promise<void> {
  const article = await createArticle(req.body, req.clinicUser?.clinicId)
  successResponse(res, article, req.t('article.createdSuccess'), 201)
}

export async function findAll(req: Request, res: Response): Promise<void> {
  const { page, limit, sortBy, sortOrder, clinicId, status } =
    req.validatedQuery

  const { data, meta } = await getArticles({
    authenticatedClinicId: req.clinicUser?.clinicId,
    clinicId,
    status,
    page,
    limit,
    sortBy,
    sortOrder,
  })

  sendPaginated(res, data, meta, req.t('article.retrievedAllSuccess'), 200)
}

export async function findAllPublic(
  req: Request,
  res: Response,
): Promise<void> {
  const { page, limit, sortBy, sortOrder, clinicId } = req.validatedQuery

  const { data, meta } = await getArticles({
    clinicId,
    status: ArticleStatus.PUBLISHED,
    page,
    limit,
    sortBy,
    sortOrder,
  })

  sendPaginated(res, data, meta, req.t('article.retrievedAllSuccess'), 200)
}

export async function findOne(req: Request, res: Response): Promise<void> {
  const article = await getArticleById(
    getParam(req.params.id),
    req.clinicUser?.clinicId,
  )
  successResponse(res, article, req.t('article.retrievedSuccess'), 200)
}

export async function findOnePublic(
  req: Request,
  res: Response,
): Promise<void> {
  const article = await getPublicArticleById(getParam(req.params.id))
  successResponse(res, article, req.t('article.retrievedSuccess'), 200)
}

export async function update(req: Request, res: Response): Promise<void> {
  const article = await updateArticle(
    getParam(req.params.id),
    req.body,
    req.clinicUser?.clinicId,
  )
  successResponse(res, article, req.t('article.updatedSuccess'), 200)
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteArticle(getParam(req.params.id), req.clinicUser?.clinicId)
  successResponse(res, null, req.t('article.deletedSuccess'), 200)
}

export async function publish(req: Request, res: Response): Promise<void> {
  const article = await publishArticle(
    getParam(req.params.id),
    req.clinicUser?.clinicId,
  )
  successResponse(res, article, req.t('article.publishedSuccess'), 200)
}

export async function archive(req: Request, res: Response): Promise<void> {
  const article = await archiveArticle(
    getParam(req.params.id),
    req.clinicUser?.clinicId,
  )
  successResponse(res, article, req.t('article.archivedSuccess'), 200)
}

export async function readResource(req: Request, res: Response): Promise<void> {
  return feedFile(
    env.UPLOADS_PATH,
    getParam(req.params.resourceValue),
    res,
    req.validatedQuery?.size,
  )
}
