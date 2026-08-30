// Controls group B — GlobeControl. One URL: /?case=controls-globe
// The case style (official maplibre globe+atmosphere example) starts in
// globe projection, so the spec is initial-state agnostic: toggle twice,
// assert the projection flips and fires onProjectionChange each time.
import { test, expect, gotoCase, waitForLog, section } from '../../fixtures/map.js'

test('GlobeControl toggles projection and fires onProjectionChange', async ({ page }) => {
  await gotoCase(page, 'controls-globe/globe')
  const sec = page
  const projection = () => page.evaluate(() => window.__MAP__.getProjection().type)

  const initial = await projection()

  // First toggle: projection flips, event reports the new state
  await sec.locator('.maplibregl-ctrl-globe').click()
  await expect.poll(projection).not.toBe(initial)
  let events = await waitForLog(page, 'projection')
  let last = events[events.length - 1].isGlobe
  expect(last).toBe((await projection()) === 'globe')

  // Second toggle: back to the initial projection
  await sec.locator('.maplibregl-ctrl-globe').click()
  await expect.poll(projection).toBe(initial)
  events = await waitForLog(page, 'projection')
  last = events[events.length - 1].isGlobe
  expect(last).toBe((await projection()) === 'globe')
})
