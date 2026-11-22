import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ApiError } from '@/lib/api-client'
import type { ApiPaginated, ListQuery, PaginationMeta } from '@/types/api'

interface UseApiListOptions<T> {
  fetcher: (params: ListQuery) => Promise<ApiPaginated<T>>
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  deps?: readonly unknown[]
}

interface UseApiListResult<T> {
  data: T[]
  meta: PaginationMeta | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useApiList<T>({
  fetcher,
  page,
  limit,
  sortBy,
  sortOrder,
  deps = [],
}: UseApiListOptions<T>): UseApiListResult<T> {
  const tCommon = useTranslations('common')
  const [data, setData] = useState<T[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetcher({ page, limit, sortBy, sortOrder })
      .then((res) => {
        if (cancelled) return
        setData(res.data)
        setMeta(res.meta)
      })
      .catch((err) => {
        if (cancelled) return
        setError(
          err instanceof ApiError ? err.message : tCommon('genericError'),
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, sortBy, sortOrder, reloadToken, ...deps])

  return {
    data,
    meta,
    loading,
    error,
    refetch: () => setReloadToken((t) => t + 1),
  }
}
