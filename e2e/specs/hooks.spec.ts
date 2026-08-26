// README claims: useMap (zoomIn/flyTo through MapProvider) and useControl.
import { test, expect, gotoCase, getMapState, waitForCameraStable } from '../fixtures/map.js'

test('useMap drives the map from outside <Map>', async ({ page }) => {
  await gotoCase(page, 'hooks/use-map')

  await page.getByTestId('zoom-in').click()
  await waitForCameraStable(page)
  let state = await getMapState(page)
  expect(state.zoom).toBeCloseTo(13, 3)

  await page.getByTestId('fly').click()
  await waitForCameraStable(page)
  state = await getMapState(page)
  expect(state.lng).toBeCloseTo(90.4, 4)
  expect(state.lat).toBeCloseTo(23.83, 4)
  expect(state.zoom).toBeCloseTo(15, 3)
})

test('useControl mounts a custom IControl into a control corner', async ({ page }) => {
  await gotoCase(page, 'hooks/use-control')
  const control = page.getByTestId('custom-control')
  await expect(control).toBeVisible()
  await expect(control).toHaveText('Custom Control')
  // Mounted inside the map's top-left control corner
  const inCorner = await control.evaluate((el) => Boolean(el.closest('.maplibregl-ctrl-top-left')))
  expect(inCorner).toBe(true)
})
