import { api } from '@/lib/api-client'
import { API_ENDPOINTS, CLINIC_ID, type ImageSize } from '@/config/api.config'
import type { ApiPaginated, ApiSuccess } from '@/types/api'
import type { Article } from '@/types/domain'

export function listArticles(params: { page?: number; limit?: number } = {}) {
  return api.get<ApiPaginated<Article>>(API_ENDPOINTS.articles.list, {
    params: { clinicId: CLINIC_ID, page: params.page, limit: params.limit },
  })
}

export async function getArticle(id: string): Promise<Article> {
  const res = await api.get<ApiSuccess<Article>>(API_ENDPOINTS.articles.byId(id))
  return res.data
}

export function articleImageUrl(filename: string, size?: ImageSize): string {
  return API_ENDPOINTS.articles.resource(filename, size)
}
