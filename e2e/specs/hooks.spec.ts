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

// NOTE: useControl's e2e case was removed per review — a bare custom IControl
// was not visually understandable in headed review. The hook remains covered
// by the unit + browser-mode suites (__tests__).
