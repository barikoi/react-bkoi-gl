// docs.barikoi.com advanced-features claims: live real-time setData,
// measure distance, measure polygon area. (animate-point-along-line is
// covered by examples/animation.)
// Deterministic cases (preset coordinates) → real-value assertions.
import { test, expect, gotoCase, waitForLog } from '../fixtures/map.js'

test('advanced/live-data: timer-driven setData grows the rendered points', async ({ page }) => {
  await gotoCase(page, 'advanced/live-data')

  const countAt = () =>
    page.evaluate(() =>
      window.__MAP__.queryRenderedFeatures(undefined, { layers: ['live-points'] }).length
    )

  // Two seed points render first.
  await expect
    .poll(countAt, { timeout: 15_000 })
    .toBeGreaterThanOrEqual(2)

  // The feed appends one point per tick (600ms) up to 7 total.
  await expect
    .poll(countAt, { timeout: 20_000 })
    .toBe(7)
  await expect(page.getByTestId('feed-count')).toHaveText('7 points')
  const feeds = await page.evaluate(() => window.__LOG__.filter(l => l.type === 'feed'))
  expect(feeds.length).toBe(5)
})

test('advanced/measure-distance: haversine between the two preset points', async ({ page }) => {
  await gotoCase(page, 'advanced/measure-distance')

  await page.getByTestId('place-a').click()
  await page.getByTestId('place-b').click()

  const [ev] = await waitForLog(page, 'distance')
  // (90.3938,23.8216) → (90.4,23.83) haversine ≈ 1127 m (±5 m tolerance)
  expect(ev.meters).toBeGreaterThan(1120)
  expect(ev.meters).toBeLessThan(1134)
  await expect(page.getByTestId('distance-readout')).toHaveText(/^1\.1[23] km$/)
})

test('advanced/measure-area: spherical ring area of the preset square', async ({ page }) => {
  await gotoCase(page, 'advanced/measure-area')

  // Fewer than 3 vertices → no area yet.
  await page.getByTestId('add-vertex').click()
  await page.getByTestId('add-vertex').click()
  await expect(page.getByTestId('area-readout')).toHaveText('add 3+ vertices')

  // Closing the ring with 3 vertices computes the TRIANGLE = half the square ≈ 0.565 km².
  await page.getByTestId('add-vertex').click()
  const [tri] = await waitForLog(page, 'area')
  expect(tri.meters).toBeGreaterThan(0.55e6)
  expect(tri.meters).toBeLessThan(0.58e6)
  await expect(page.getByTestId('area-readout')).toHaveText(/^0\.56[0-9]{2} km²$/)

  // Fourth vertex completes the square ≈ 1.13 km² (2× the triangle).
  await page.getByTestId('add-vertex').click()
  const events = await page.evaluate(() => window.__LOG__.filter(l => l.type === 'area'))
  expect(events.length).toBe(2)
  expect(events[1].meters).toBeGreaterThan(1.1e6)
  expect(events[1].meters).toBeLessThan(1.16e6)
  expect(events[1].meters).toBeCloseTo(tri.meters * 2, -4)
  await expect(page.getByTestId('area-readout')).toHaveText(/^1\.1[0-9]{3} km²$/)
})
