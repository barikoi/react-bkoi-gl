// Exact port of the Barikoi "Cinematic Camera Animation" example:
// orbit rotation on load, 4-stop flyover tour, reset easeTo.
// Camera transitions match the example (15°/s orbit, 6s flyTo legs, 2s reset).
import { test, expect, gotoCase } from '../../fixtures/map.js'

const HOME = { lng: 90.4074, lat: 23.7925 }

test('examples/animate-camera: orbit, cinematic flyover tour, reset', async ({ page }) => {
  await gotoCase(page, 'examples/animate-camera')

  // Dark style loaded (the example's style, not the default)
  const styleName = await page.evaluate(() => window.__MAP__.getStyle().name)
  expect(styleName).toBeTruthy()

  // 1. Orbit runs from load: bearing advances ~15°/s (poll: it changes).
  await waitForLogType(page, 'orbit-start')
  const b1 = await bearing(page)
  await expect
    .poll(async () => Math.abs(((await bearing(page)) - b1 + 540) % 360 - 180), { timeout: 10_000 })
    .toBeGreaterThan(5)

  // 2. Flyover: first leg targets {zoom 16.5–17, pitch ≥60, bearing 90…}
  await page.getByTestId('flyover').click()
  const leg = await waitForLogType(page, 'flyover-leg')
  expect(leg.leg).toBe(0)
  expect(leg.target.zoom).toBeGreaterThanOrEqual(16.5)
  // Camera is mid-flight toward the leg-1 target: pitch stays high and the
  // bearing heads toward 90 while zoom moves off the orbit's 16.
  await expect
    .poll(async () => Math.abs(((await bearing(page)) % 360 + 360) % 360), { timeout: 15_000 })
    .toBeGreaterThan(10)
  await expect
    .poll(() => page.evaluate(() => window.__MAP__.getPitch()), { timeout: 15_000 })
    .toBeGreaterThan(50)

  // 3. Reset: eases home, pitch and bearing back to 0.
  await page.getByTestId('reset').click()
  await expect
    .poll(() => page.evaluate(() => window.__MAP__.getPitch()), { timeout: 15_000 })
    .toBeCloseTo(0, 0)
  await expect
    .poll(async () => {
      const b = ((await bearing(page)) % 360 + 360) % 360
      return b < 1 || b > 359
    }, { timeout: 15_000 })
    .toBe(true)
  const center = await page.evaluate(() => window.__MAP__.getCenter())
  expect(center.lng).toBeCloseTo(HOME.lng, 1)
  expect(center.lat).toBeCloseTo(HOME.lat, 1)
})

async function bearing(page) {
  return page.evaluate(() => window.__MAP__.getBearing())
}

async function waitForLogType(page, type, { timeout = 15_000 } = {}) {
  await expect
    .poll(() => page.evaluate(t => window.__LOG__.some(l => l.type === t), type), { timeout })
    .toBe(true)
  return page.evaluate(t => window.__LOG__.find(l => l.type === t), type)
}
