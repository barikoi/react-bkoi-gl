// Unit tests for src/maplibre/worker-setup.ts
//
// The module bakes FILE_URL from import.meta.url at import time (file:// under
// vitest) and memoizes `settled` per module instance, so each case resets
// modules and imports a fresh copy.

const importFresh = async () => {
  vi.resetModules()
  return import('../../../src/maplibre/worker-setup')
}

const makeLib = (extra = {}) => ({
  setWorkerUrl: vi.fn(),
  getWorkerUrl: vi.fn(() => ''),
  ...extra,
})

describe('ensureWorkerUrl', () => {
  const realCreateObjectURL = URL.createObjectURL

  afterEach(() => {
    // restore whatever the test stubbed
    if (realCreateObjectURL) {
      URL.createObjectURL = realCreateObjectURL
    } else {
      delete URL.createObjectURL
    }
    vi.resetModules()
  })

  test('SSR (no window): resolves without touching mapLib', async () => {
    const win = globalThis.window
    // @ts-expect-error — simulate server environment
    delete globalThis.window
    try {
      const { ensureWorkerUrl } = await importFresh()
      const lib = makeLib()
      await ensureWorkerUrl(lib)
      expect(lib.setWorkerUrl).not.toHaveBeenCalled()
    } finally {
      globalThis.window = win
    }
  })

  test('mapLib without setWorkerUrl: no-op resolve', async () => {
    const { ensureWorkerUrl } = await importFresh()
    await expect(ensureWorkerUrl({})).resolves.toBeUndefined()
  })

  test('explicit consumer override is respected and never overwritten', async () => {
    const { ensureWorkerUrl } = await importFresh()
    const lib = makeLib({ getWorkerUrl: vi.fn(() => 'https://self.hosted/worker.mjs') })
    await ensureWorkerUrl(lib)
    expect(lib.setWorkerUrl).not.toHaveBeenCalled()
  })

  test('file:// FILE_URL skips the probe and falls back to a Blob worker', async () => {
    // Under vitest, import.meta.url is a file:// URL → the http(s) probe is
    // skipped by construction and the Blob fallback runs.
    URL.createObjectURL = vi.fn(() => 'blob:mocked-url')
    const { ensureWorkerUrl } = await importFresh()
    const lib = makeLib()
    await ensureWorkerUrl(lib)
    expect(lib.setWorkerUrl).toHaveBeenCalledWith('blob:mocked-url')
  })

  test('environments without URL.createObjectURL get the sentinel blob URL', async () => {
    // Simulate a jsdom-like env lacking Blob URLs (delete does not reliably
    // remove the static on some URL implementations, so assign undefined)
    // @ts-expect-error — deliberately break the API
    URL.createObjectURL = undefined
    const { ensureWorkerUrl } = await importFresh()
    const lib = makeLib()
    await ensureWorkerUrl(lib)
    expect(lib.setWorkerUrl).toHaveBeenCalledWith('blob:bkoi-map-worker')
  })

  test('settled promise memoizes: second call does not re-register', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:mocked-url')
    const { ensureWorkerUrl } = await importFresh()
    const lib = makeLib()
    await ensureWorkerUrl(lib)
    const createCalls = URL.createObjectURL.mock.calls.length
    await ensureWorkerUrl(makeLib())
    expect(URL.createObjectURL.mock.calls.length).toBe(createCalls)
  })
})

describe('settleWorkerUrl', () => {
  const realCreateObjectURL = URL.createObjectURL

  afterEach(() => {
    if (realCreateObjectURL) {
      URL.createObjectURL = realCreateObjectURL
    } else {
      delete URL.createObjectURL
    }
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  test('null fileUrl (bare-CJS build) registers the Blob worker', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:mocked-url')
    const { settleWorkerUrl } = await importFresh()
    const lib = makeLib()

    await settleWorkerUrl(null, lib)

    expect(lib.setWorkerUrl).toHaveBeenCalledWith('blob:mocked-url')
  })

  test('http(s) asset serving JavaScript is registered directly', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({ ok: true, headers: { get: () => 'text/javascript' } })
    )
    vi.stubGlobal('fetch', fetchMock)
    const { settleWorkerUrl } = await importFresh()
    const lib = makeLib()

    await settleWorkerUrl('https://cdn.example.com/bkoi-map-worker.mjs', lib)

    expect(fetchMock).toHaveBeenCalledWith('https://cdn.example.com/bkoi-map-worker.mjs', {
      method: 'HEAD',
    })
    expect(lib.setWorkerUrl).toHaveBeenCalledWith('https://cdn.example.com/bkoi-map-worker.mjs')
  })

  test('dev-server HTML fallback (non-JS content type) falls back to the Blob', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:mocked-url')
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, headers: { get: () => 'text/html' } }))
    )
    const { settleWorkerUrl } = await importFresh()
    const lib = makeLib()

    await settleWorkerUrl('https://cdn.example.com/bkoi-map-worker.mjs', lib)

    expect(lib.setWorkerUrl).toHaveBeenCalledWith('blob:mocked-url')
  })

  test('failed probe (rejected fetch) falls back to the Blob', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:mocked-url')
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network down')))
    )
    const { settleWorkerUrl } = await importFresh()
    const lib = makeLib()

    await expect(
      settleWorkerUrl('https://cdn.example.com/bkoi-map-worker.mjs', lib)
    ).resolves.toBeUndefined()

    expect(lib.setWorkerUrl).toHaveBeenCalledWith('blob:mocked-url')
  })

  test('non-http fileUrl skips the probe entirely', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:mocked-url')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { settleWorkerUrl } = await importFresh()
    const lib = makeLib()

    await settleWorkerUrl('file:///app/dist/bkoi-map-worker.mjs', lib)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(lib.setWorkerUrl).toHaveBeenCalledWith('blob:mocked-url')
  })
})
