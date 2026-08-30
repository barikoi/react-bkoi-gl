// Controls group D — TerrainControl. One URL: /?case=controls-terrain
// Real open Terrarium DEM is embedded in the case, so terrain must not only
// mount the control but actually be applied to the map.
import { test, expect, gotoCase, section } from '../../fixtures/map.js'

test('TerrainControl mounts, toggles terrain on/off with the open DEM', async ({ page }) => {
  await gotoCase(page, 'controls-terrain/terrain')
  await expect(page.locator('.maplibregl-ctrl-terrain')).toBeVisible()

  // The official "display buildings in 3D" example layer is present
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const l = window.__MAP__?.getStyle().layers?.find(x => x.id === '3d-buildings')
          return l?.type === 'fill-extrusion' && l['source-layer'] === 'building' ? 'ok' : ''
        }),
      { timeout: 20_000 }
    )
    .toBe('ok')

  // The control is a toggle: terrain applies only when enabled
  const toggle = page.getByRole('button', { name: 'Enable terrain' })
  await toggle.click()
  await expect
    .poll(() => page.evaluate(() => window.__MAP__?.getTerrain()?.source), { timeout: 20_000 })
    .toBe('terrain-dem')

  // Toggle off removes it
  await page.getByRole('button', { name: 'Disable terrain' }).click()
  await expect.poll(() => page.evaluate(() => window.__MAP__?.getTerrain())).toBe(null)
})
