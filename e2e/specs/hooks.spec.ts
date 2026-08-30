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

test('useControl mounts a custom IControl with live map state', async ({ page }) => {
  await gotoCase(page, 'hooks/use-control')

  const readout = page.getByTestId('zoom-readout')
  await expect(readout).toBeVisible()
  await expect(readout).toHaveText('Zoom: 12.0')

  // The control re-renders itself from map events — the library contract
  // is that useControl keeps the IControl mounted and wired to the map.
  await page.getByTestId('zoom-in').click()
  await waitForCameraStable(page)
  await expect(readout).toHaveText('Zoom: 13.0')
})

// NOTE: useControl's earlier bare-control case was removed per review; the
// replacement case (live zoom readout) is below.
