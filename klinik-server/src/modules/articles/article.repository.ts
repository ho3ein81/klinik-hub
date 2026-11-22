import { Article, Prisma } from '@prisma/client'
import prisma from '../../db/prisma'
import { BaseRepository } from '../../db/base.repository'

export class ArticleRepository extends BaseRepository<
  Article,
  Prisma.ArticleWhereInput,
  Prisma.ArticleWhereUniqueInput,
  Prisma.ArticleOrderByWithRelationInput,
  Prisma.ArticleUncheckedCreateInput,
  Prisma.ArticleUncheckedUpdateInput
> {
  constructor() {
    super(prisma, 'article')
  }
}

export const articleRepository = new ArticleRepository()
