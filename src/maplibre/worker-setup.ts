import { BKOI_WORKER_SOURCE } from './worker-bundle.generated'

/**
 * Registers the correct worker URL on the engine before the first `<Map>` is
 * constructed — zero configuration for the consumer, in every bundler.
 *
 * Strategy:
 *  1. The package ships a self-contained worker at `dist/bkoi-map-worker.mjs`
 *     (exported as `react-bkoi-gl/worker`). Bundlers that emit
 *     `new URL(..., import.meta.url)` assets (webpack 5 / CRA / Next.js, both
 *     Turbopack and webpack modes) make that URL real, same-origin, and
 *     cacheable — CSP `worker-src 'self'` is enough.
 *  2. Bundlers that do NOT emit the asset (Vite dev pre-bundling, plain
 *     esbuild/Rollup) leave the URL dead. We detect that with a HEAD probe
 *     (content-type must be JavaScript — a dev-server HTML fallback counts as
 *     missing) and fall back to a same-origin Blob worker constructed from the
 *     inlined worker source. Strict CSPs then need `worker-src 'self' blob:`,
 *     or can self-host the file and override via `setWorkerUrl` /
 *     the `workerUrl` prop.
 *
 * An explicit consumer override (getWorkerUrl() != our file URL) is always
 * respected and never second-guessed.
 */

const FILE_URL: string | null = (() => {
  try {
    return new URL('./bkoi-map-worker.mjs', import.meta.url).toString()
  } catch {
    // import.meta unavailable (bare-CJS) — Blob fallback handles everything.
    return null
  }
})()

let blobUrl: string | null = null
let settled: Promise<void> | null = null

function blobWorkerUrl(): string {
  if (!blobUrl) {
    if (typeof URL.createObjectURL === 'function') {
      blobUrl = URL.createObjectURL(new Blob([BKOI_WORKER_SOURCE], { type: 'text/javascript' }))
    } else {
      // No Blob URLs in this environment (e.g. jsdom) — engine is mocked there.
      blobUrl = 'blob:bkoi-map-worker'
    }
  }
  return blobUrl
}

export function ensureWorkerUrl(mapLib: unknown): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  const lib = mapLib as {
    setWorkerUrl?: (value: string) => void
    getWorkerUrl?: () => string
  }
  if (!lib.setWorkerUrl) return Promise.resolve()

  const current = lib.getWorkerUrl?.()
  if (current && current !== FILE_URL) {
    // Explicit consumer override (setWorkerUrl() or workerUrl prop) — respect it.
    return Promise.resolve()
  }

  if (!FILE_URL) {
    lib.setWorkerUrl(blobWorkerUrl())
    return Promise.resolve()
  }

  settled ??= (async () => {
    // Only http(s) URLs can be bundler-emitted assets; file:// (tests,
    // file:// pages) can neither be probed nor host a Worker — use the Blob.
    if (/^https?:/.test(FILE_URL)) {
      try {
        const res = await fetch(FILE_URL, { method: 'HEAD' })
        const type = res.headers.get('content-type') || ''
        if (res.ok && /javascript|ecmascript/i.test(type)) {
          lib.setWorkerUrl(FILE_URL)
          return
        }
      } catch {
        // probe failed — fall through to the Blob worker
      }
    }
    lib.setWorkerUrl(blobWorkerUrl())
  })()
  return settled
}
