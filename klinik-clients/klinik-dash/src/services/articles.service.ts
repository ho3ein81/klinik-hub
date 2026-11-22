import { api } from '@/lib/api-client'
import { API_ENDPOINTS, type ImageSize } from '@/config/api.config'
import type { ApiPaginated, ApiSuccess, ListQuery } from '@/types/api'
import type { Article, ArticleStatus } from '@/types/domain'

export interface ArticleInput {
  title: string
  content: string
}

function toFormData(
  input: Partial<ArticleInput>,
  imageFile?: File | null,
): FormData {
  const fd = new FormData()
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      fd.append(key, String(value))
    }
  })
  if (imageFile) fd.append('image', imageFile)
  return fd
}

export function listArticles(params: ListQuery & { status?: ArticleStatus }) {
  return api.get<ApiPaginated<Article>>(API_ENDPOINTS.articles.list, { params })
}

export async function getArticle(id: string): Promise<Article> {
  const res = await api.get<ApiSuccess<Article>>(API_ENDPOINTS.articles.byId(id))
  return res.data
}

export async function createArticle(
  input: ArticleInput,
  imageFile?: File | null,
): Promise<Article> {
  const body = imageFile ? toFormData(input, imageFile) : input
  const res = await api.post<ApiSuccess<Article>>(API_ENDPOINTS.articles.list, body)
  return res.data
}

export async function updateArticle(
  id: string,
  input: Partial<ArticleInput>,
  imageFile?: File | null,
): Promise<Article> {
  const body = imageFile ? toFormData(input, imageFile) : input
  const res = await api.patch<ApiSuccess<Article>>(
    API_ENDPOINTS.articles.byId(id),
    body,
  )
  return res.data
}

export async function deleteArticle(id: string): Promise<void> {
  await api.delete(API_ENDPOINTS.articles.byId(id))
}

export async function publishArticle(id: string): Promise<void> {
  await api.patch(API_ENDPOINTS.articles.publish(id))
}

export async function archiveArticle(id: string): Promise<void> {
  await api.patch(API_ENDPOINTS.articles.archive(id))
}

export function articleImageUrl(filename: string, size?: ImageSize): string {
  return API_ENDPOINTS.articles.resource(filename, size)
}
