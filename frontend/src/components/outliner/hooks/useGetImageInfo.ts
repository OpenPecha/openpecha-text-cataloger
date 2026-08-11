import { useEffect, useRef, useState } from 'react'
import { proxiedImageUrl } from '@/lib/imageProxy'

/** Whether IIIF serves this volume to an unauthenticated browser. */
export type VolumeImageAccess = 'unknown' | 'public' | 'restricted'

export type ImageInfoResult = {
  info: any
  /** Only `public` is safe to load directly; anything else must use the proxy. */
  access: VolumeImageAccess
}

/**
 * Loads IIIF `info.json` for a volume's first page, and reports whether IIIF serves
 * the volume anonymously. The request doubles as the access probe, so detection adds
 * no extra round trip — info.json was already needed for page sizing.
 */
function useGetImageInfo({
  volId,
  pname,
  getProxyFetchHeaders,
}: {
  volId: string
  pname: string
  getProxyFetchHeaders?: () => Promise<HeadersInit | undefined>
}): ImageInfoResult {
  const [result, setResult] = useState<ImageInfoResult>({
    info: null,
    access: 'unknown',
  })
  const getHeadersRef = useRef(getProxyFetchHeaders)
  getHeadersRef.current = getProxyFetchHeaders

  useEffect(() => {
    if (!volId || !pname) {
      setResult({ info: null, access: 'unknown' })
      return
    }

    const ac = new AbortController()
    let cancelled = false
    const iiifUrl = `https://iiif.bdrc.io/bdr:${volId}::${pname}/info.json`

    /** Restricted volumes still need width/height, which only the proxy can fetch. */
    const loadInfoViaProxy = async (
      access: VolumeImageAccess
    ): Promise<ImageInfoResult> => {
      const proxyUrl = proxiedImageUrl(iiifUrl)
      if (!proxyUrl) return { info: null, access }
      try {
        const getHeaders = getHeadersRef.current
        const extra = getHeaders ? await getHeaders() : undefined
        const res = await fetch(proxyUrl, {
          signal: ac.signal,
          headers: extra ? new Headers(extra) : undefined,
        })
        if (!res.ok) return { info: null, access }
        return { info: await res.json(), access }
      } catch {
        return { info: null, access }
      }
    }

    ;(async () => {
      let next: ImageInfoResult
      try {
        const response = await fetch(iiifUrl, { signal: ac.signal })
        if (response.status === 401 || response.status === 403) {
          next = await loadInfoViaProxy('restricted')
        } else if (!response.ok) {
          // Upstream error rather than an access decision — stay on the proxy.
          next = await loadInfoViaProxy('unknown')
        } else {
          next = { info: await response.json(), access: 'public' }
        }
      } catch {
        // Aborted, offline, or CORS failure: fall back to the proxy.
        next = ac.signal.aborted
          ? { info: null, access: 'unknown' }
          : await loadInfoViaProxy('unknown')
      }
      if (!cancelled) setResult(next)
    })()

    return () => {
      cancelled = true
      ac.abort()
    }
  }, [volId, pname])

  return result
}

export default useGetImageInfo
