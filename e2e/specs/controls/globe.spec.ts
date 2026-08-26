// Controls group B — GlobeControl. One URL: /?case=controls-globe
import { test, expect, gotoCase, waitForLog, section } from '../../fixtures/map.js'

test('GlobeControl switches projection and fires onProjectionChange', async ({ page }) => {
  await gotoCase(page, 'controls-globe/globe')
  const sec = page
  await sec.locator('.maplibregl-ctrl-globe').click()
  const [ev] = await waitForLog(page, 'projection')
  expect(ev.isGlobe).toBe(true)
  const type = await page.evaluate(() => window.__MAP__.getProjection().type)
  expect(type).toBe('globe')

  await sec.locator('.maplibre-gl-ctrl-globe, .maplibregl-ctrl-globe').first().click()
  // Poll for the SETTLED projection state: a late initial isGlobe:true event can
  // arrive after the toggle (headed runs are slower to dispatch).
  await expect
    .poll(async () => {
      const events = await waitForLog(page, 'projection')
      return events[events.length - 1].isGlobe
    })
    .toBe(false)
})
