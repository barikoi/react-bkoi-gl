// Page-object fixtures shared by all e2e specs. Poll-based waits only —
// no one-shot event registration that can race a condition already true.
import { test as base, expect, type Page, type TestInfo } from '@playwright/test'

// Headed runs (--headed / e2e:headed) hold each finished test on screen for
// 10s so a human can review whether rendering looks right. Headless: no-op.
const REVIEW_HOLD_MS = 10_000

const isHeadedRun = (testInfo: TestInfo) =>
  (testInfo.project.use as { headless?: boolean }).headless === false

/**
 * Bottom-center status pill shared by every spec: “Rendering · <module>”
 * while the case runs, extended with the review-hold progress bar afterwards.
 * Mounted here (not in app code) so ALL specs get identical UI.
 */
async function mountHud(page: Page) {
  if (page.isClosed()) return
  await page.evaluate(() => {
    if (document.getElementById('e2e-hud')) return
    const title = document.querySelector('.case-page-title')?.textContent?.trim()
    const name =
      title || new URLSearchParams(location.search).get('case') || ''
    const el = document.createElement('div')
    el.id = 'e2e-hud'
    el.innerHTML = '<span class="dot"></span><span class="label"></span><span class="hold"></span>'
    ;(el.querySelector('.label') as HTMLElement).textContent = `Rendering · ${name}`
    document.body.appendChild(el)
  })
}

/** Headed-only 10s hold: progress bar drains, then pill goes away.
 * Skips blank fixture pages — tests using { browser } instead of { page }
 * (e.g. geolocate's custom context) leave an unused about:blank fixture page
 * that must not get held open as a stray last window. */
async function holdForReview(page: Page, testInfo: TestInfo) {
  if (!isHeadedRun(testInfo) || page.isClosed()) return
  if (!page.url() || page.url() === 'about:blank') return
  try {
    await mountHud(page)
    await page.evaluate(
    (ms) => {
      const el = document.getElementById('e2e-hud')
      const hold = el?.querySelector('.hold') as HTMLElement | null
      if (!hold) return
      hold.innerHTML = '<span class="bar"><i></i></span>'
      const bar = hold.querySelector('.bar i') as HTMLElement | null
      const t0 = performance.now()
      return new Promise<void>((resolve) => {
        const tick = () => {
          const left = Math.max(0, ms - (performance.now() - t0))
          if (bar) bar.style.width = `${(left / ms) * 100}%`
          if (left <= 0) resolve()
          else requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }).then(() => el?.remove())
    },
    REVIEW_HOLD_MS,
  )
  } catch {
    // The hold is a cosmetic review aid — a destroyed context (renderer
    // reload, navigation) must never fail the test.
  }
}

// The hold is a LAZY page-fixture wrapper (not an auto fixture and not
// test.afterEach): it only instantiates the page when the test actually
// depends on it, runs the hold after the test body, and applies to every
// spec file — module-level hooks in a shared fixture only attach to the
// first importing file, silently losing later files.
export const test = base.extend({
  page: async ({ page: basePage }, use, testInfo) => {
    await use(basePage)
    await holdForReview(basePage, testInfo)
  },
})

const isMapSettled = () => {
  const m = window.__MAP__
  // NOTE: areTilesLoaded() deliberately NOT required — a single failed/late
  // tile (or a maximized headed viewport needing 4× the tiles) blocks the
  // gate past the 60s test timeout. Every downstream assertion retries on
  // its own timeout, so style-loaded + camera-idle is the right gate.
  return Boolean(
    m &&
      m.isStyleLoaded() &&
      !m.isMoving() &&
      !m.isZooming() &&
      !m.isRotating(),
  )
}

/** Scoped locator — full-page cases now, so it aliases the page itself. */
export function section(page) {
  return page.locator('body')
}

/**
 * Navigate to a case page and wait until its map settles.
 * One URL per case: /?case=<id> renders exactly ONE full-viewport map.
 *
 * Branding contract enforced here so EVERY spec inherits it:
 *   - Barikoi logo renders on all cases (no hide prop exists).
 *   - Attribution control renders everywhere EXCEPT cases listed in
 *     NO_ATTRIBUTION_CASES (showAttribution={false}).
 * Both assertions retry over the expect timeout — maplibre rebuilds the
 * attribution DOM as tiles land right after load.
 */
const NO_ATTRIBUTION_CASES = new Set(['map/no-defaults'])

export async function gotoCase(page, id) {
  await page.goto(`/?case=${id}`)
  await mountHud(page)
  await expect
    .poll(() => page.evaluate(() => Boolean(window.__MAP__)), { timeout: 45_000 })
    .toBeTruthy()
  await expect
    .poll(() => page.evaluate(isMapSettled), { timeout: 45_000 })
    .toBeTruthy()

  const logo = page.locator('a.maplibregl-ctrl-logo[href*="barikoi.com"]').first()
  await expect(logo).toBeVisible()
  if (NO_ATTRIBUTION_CASES.has(id)) {
    await expect(page.locator('.maplibregl-ctrl-attrib')).toHaveCount(0)
  } else {
    await expect(page.locator('.maplibregl-ctrl-attrib').first()).toBeVisible()
  }
}

export async function getMapState(page, sectionId) {
  return page.evaluate((s) => {
    const map = (s && window.__MAPS__?.[s]) || window.__MAP__
    const c = map.getCenter()
    return {
      lng: c.lng,
      lat: c.lat,
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
    }
  }, sectionId)
}

/** Query rendered features at a screen point (defaults to viewport center). */
export async function queryFeaturesAt(page, layerId, point = null, sectionId) {
  return page.evaluate(
    ({ layerId, point, sectionId }) => {
      const map = (sectionId && window.__MAPS__?.[sectionId]) || window.__MAP__
      const box = point ? [point, point] : undefined
      return map.queryRenderedFeatures(box, { layers: [layerId] })
    },
    { layerId, point, sectionId },
  )
}

/** Wait for ≥1 log entry of `type`; returns all matching entries. */
export async function waitForLog(page, type, { timeout = 15_000 } = {}) {
  await expect
    .poll(
      () =>
        page.evaluate(
          (t) => window.__LOG__.filter((l) => l.type === t).length,
          type,
        ),
      { timeout },
    )
    .toBeGreaterThan(0)
  return page.evaluate(
    (t) => window.__LOG__.filter((l) => l.type === t),
    type,
  )
}

/** Wait until the camera has been quiet for `ms` (any move restarts the timer). */
export async function waitForCameraStable(page, ms = 600, sectionId) {
  await page.evaluate(
    ({ ms, s }) =>
      new Promise((resolve) => {
        const map = (s && window.__MAPS__?.[s]) || window.__MAP__
        let timer = setTimeout(resolve, ms)
        const onMove = () => {
          clearTimeout(timer)
          timer = setTimeout(() => {
            map.off('move', onMove)
            resolve()
          }, ms)
        }
        map.on('move', onMove)
      }),
    { ms, s: sectionId },
  )
}

export { expect }
