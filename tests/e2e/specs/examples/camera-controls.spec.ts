// MapLibre official example covered with open data — one URL, one window.
import { test, expect, gotoCase } from '../../fixtures/map.js'

test('examples/camera-controls: fitBounds, setPitch, setBearing', async ({ page }) => {
  await gotoCase(page, 'examples/camera-controls')
  await page.getByTestId('fit-bangladesh').click()
  await expect
    .poll(() => page.evaluate(() => window.__MAP__.getZoom()), { timeout: 20_000 })
    .toBeLessThan(8) // fitting Bangladesh zooms way out from the default 12
  await expect
    .poll(() => page.evaluate(() => window.__MAP__.getCenter()))
    .toMatchObject({ lng: expect.closeTo(90.35, 0), lat: expect.closeTo(23.5, 0) })

  await page.getByTestId('pitch').click()
  await expect
    .poll(() => page.evaluate(() => window.__MAP__.getPitch()), { timeout: 10_000 })
    .toBeGreaterThan(55)

  await page.getByTestId('bearing').click()
  await expect
    .poll(() => page.evaluate(() => window.__MAP__.getBearing()), { timeout: 10_000 })
    .toBeLessThan(-25)
})
