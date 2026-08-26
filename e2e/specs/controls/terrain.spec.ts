// Controls group D — TerrainControl. One URL: /?case=controls-terrain
// Mount-only: interaction requires a raster-dem source (none embedded).
import { test, expect, gotoCase, section } from '../../fixtures/map.js'

test('TerrainControl mounts', async ({ page }) => {
  await gotoCase(page, 'controls-terrain/terrain')
  await expect(page.locator('.maplibregl-ctrl-terrain')).toBeVisible()
})
