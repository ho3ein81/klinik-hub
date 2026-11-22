import { useEffect, useState } from 'react'
import { fetchProtectedBlobUrl } from '@/lib/api-client'

/** Loads a Bearer-token-protected image (avatar/service/clinic) as a local object URL. */
export function useProtectedImage(url: string | null): string | null {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!url) {
      setSrc(null)
      return
    }

    let cancelled = false
    let objectUrl: string | null = null

    fetchProtectedBlobUrl(url)
      .then((blobUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(blobUrl)
          return
        }
        objectUrl = blobUrl
        setSrc(blobUrl)
      })
      .catch(() => setSrc(null))

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url])

  return src
}
