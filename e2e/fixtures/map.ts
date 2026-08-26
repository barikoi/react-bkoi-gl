// Page-object fixtures shared by all e2e specs. Poll-based waits only —
// no one-shot event registration that can race a condition already true.
import { test as base, expect } from '@playwright/test'

const isMapSettled = () => {
  const m = window.__MAP__
  return Boolean(
    m &&
      m.isStyleLoaded() &&
      !m.isMoving() &&
      !m.isZooming() &&
      !m.isRotating() &&
      m.areTilesLoaded(),
  )
}

/** Scoped locator — full-page cases now, so it aliases the page itself. */
export function section(page) {
  return page.locator('body')
}

/**
 * Navigate to a case page and wait until its map settles.
 * One URL per case: /?case=<id> renders exactly ONE full-viewport map.
 */
export async function gotoCase(page, id) {
  await page.goto(`/?case=${id}`)
  await expect
    .poll(() => page.evaluate(() => Boolean(window.__MAP__)), { timeout: 45_000 })
    .toBeTruthy()
  await expect
    .poll(() => page.evaluate(isMapSettled), { timeout: 45_000 })
    .toBeTruthy()
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

export const test = base
export { expect }
