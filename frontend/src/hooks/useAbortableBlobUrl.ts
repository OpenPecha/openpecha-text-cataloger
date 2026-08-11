import { useEffect, useRef, useState } from 'react'

export type UseAbortableBlobUrlOptions = {
  /**
   * When false, in-flight fetches are aborted and new ones are not started.
   * An object URL that was already created for the current `src` is kept until
   * `src` changes or the component unmounts.
   */
  fetchEnabled?: boolean
  /** Extra headers for `fetch` (e.g. `Authorization: Bearer` on the outliner image proxy). */
  getFetchHeaders?: () => Promise<HeadersInit | undefined>
  /**
   * URL to retry when `src` fails. BDRC IIIF applies access per page, not per volume,
   * so individual pages of an otherwise-public volume can still 401.
   */
  fallbackSrc?: string | null
  getFallbackFetchHeaders?: () => Promise<HeadersInit | undefined>
}

/**
 * Fetches a URL into a blob object URL and revokes it when `src` changes or on unmount.
 * AbortController cancels the network request when the consuming component unmounts
 * (e.g. react-window row scrolled away) or when `fetchEnabled` becomes false.
 */
export function useAbortableBlobUrl(
  src: string | null,
  options?: UseAbortableBlobUrlOptions
): string | null {
  const fetchEnabled = options?.fetchEnabled !== false
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const prevSrcRef = useRef<string | null>(null)
  /** `src` for which `objectUrl` was last created successfully — avoids refetch when `fetchEnabled` flips (e.g. scroll pause). */
  const blobSrcRef = useRef<string | null>(null)
  const getFetchHeadersRef = useRef(options?.getFetchHeaders)
  getFetchHeadersRef.current = options?.getFetchHeaders
  const fallbackSrc = options?.fallbackSrc ?? null
  const getFallbackFetchHeadersRef = useRef(options?.getFallbackFetchHeaders)
  getFallbackFetchHeadersRef.current = options?.getFallbackFetchHeaders

  useEffect(() => {
    if (!src) {
      prevSrcRef.current = null
      blobSrcRef.current = null
      setObjectUrl((u) => {
        if (u) URL.revokeObjectURL(u)
        return null
      })
      return
    }

    const prev = prevSrcRef.current
    if (prev != null && prev !== src) {
      blobSrcRef.current = null
      setObjectUrl((u) => {
        if (u) URL.revokeObjectURL(u)
        return null
      })
    }
    prevSrcRef.current = src
  }, [src])

  useEffect(() => {
    if (!src || !fetchEnabled) return
    if (blobSrcRef.current === src) return

    const ac = new AbortController()
    let cancelled = false
    const requestSrc = src

    /** Null on failure so the caller can try the fallback. */
    const fetchBlob = async (
      url: string,
      getHeaders?: () => Promise<HeadersInit | undefined>
    ): Promise<Blob | null> => {
      try {
        const extra = getHeaders ? await getHeaders() : undefined
        const headers = extra ? new Headers(extra) : undefined
        const res = await fetch(url, { signal: ac.signal, headers })
        if (!res.ok) return null
        return await res.blob()
      } catch {
        return null
      }
    }

    ;(async () => {
      let blob = await fetchBlob(requestSrc, getFetchHeadersRef.current)

      // A direct IIIF page can 401 even when the volume's first page is public.
      if (!blob && fallbackSrc && fallbackSrc !== requestSrc && !ac.signal.aborted) {
        blob = await fetchBlob(fallbackSrc, getFallbackFetchHeadersRef.current)
      }

      if (!blob || cancelled || ac.signal.aborted) return
      const u = URL.createObjectURL(blob)
      if (cancelled || requestSrc !== prevSrcRef.current) {
        URL.revokeObjectURL(u)
        return
      }
      blobSrcRef.current = requestSrc
      setObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return u
      })
    })()

    return () => {
      cancelled = true
      ac.abort()
    }
  }, [src, fetchEnabled, fallbackSrc])

  useEffect(() => {
    return () => {
      blobSrcRef.current = null
      setObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [])

  return objectUrl
}
