// Controls group A — camera + basic controls: Navigation zoom buttons,
// MapRef zoomIn/zoomOut/flyTo, Scale, Fullscreen, Geolocate.
// One URL: /?case=controls-camera
import {
  test,
  expect,
  gotoCase,
  getMapState,
  waitForLog,
  waitForCameraStable,
  section,
} from '../../fixtures/map.js'

test('NavigationControl: zoom buttons and compass render; zoom-in works', async ({ page }) => {
  await gotoCase(page, 'controls-camera/navigation')
  const sec = page
  await expect(sec.locator('.maplibregl-ctrl-zoom-in')).toBeVisible()
  await expect(sec.locator('.maplibregl-ctrl-zoom-out')).toBeVisible()
  await expect(sec.locator('.maplibregl-ctrl-compass')).toBeVisible()

  const before = await getMapState(page)
  await sec.locator('.maplibregl-ctrl-zoom-in').click()
  await waitForCameraStable(page)
  const after = await getMapState(page)
  expect(after.zoom).toBeCloseTo(before.zoom + 1, 3)
})

test('MapRef camera: zoomIn, zoomOut, and flyTo drive the map', async ({ page }) => {
  await gotoCase(page, 'controls-camera/camera-ref')

  const readLastReport = async () => {
    const reports = await page.evaluate(() => window.__LOG__.filter(l => l.type === 'ref-report'))
    return reports[reports.length - 1]
  }

  await page.getByTestId('report').click()
  let report = await readLastReport()
  expect(report.zoom).toBeCloseTo(12, 5)

  await page.getByTestId('zoom-in').click()
  await waitForCameraStable(page)
  await page.getByTestId('report').click()
  report = await readLastReport()
  expect(report.zoom).toBeCloseTo(13, 3)

  await page.getByTestId('zoom-out').click()
  await waitForCameraStable(page)
  await page.getByTestId('zoom-out').click()
  await waitForCameraStable(page)
  await page.getByTestId('report').click()
  report = await readLastReport()
  expect(report.zoom).toBeCloseTo(11, 3)

  await page.getByTestId('fly').click()
  await waitForCameraStable(page)
  await page.getByTestId('report').click()
  report = await readLastReport()
  expect(report.center.lng).toBeCloseTo(90.4, 4)
  expect(report.center.lat).toBeCloseTo(23.83, 4)
  expect(report.zoom).toBeCloseTo(15, 3)
})

test('ScaleControl renders metric scale', async ({ page }) => {
  await gotoCase(page, 'controls-camera/scale')
  const scale = page.locator('.maplibregl-ctrl-scale')
  await expect(scale).toBeVisible()
  const text = await scale.textContent()
  expect(text).toMatch(/(m|km)/)
})

test('FullscreenControl toggles fullscreen', async ({ page }) => {
  await gotoCase(page, 'controls-camera/fullscreen')
  // Headless-shell may report fullscreen as already active at load, so
  // locate the button by either class and assert the state TOGGLES.
  const btn = page.locator(
    '.maplibregl-ctrl-group button[class*=fullscreen], .maplibregl-ctrl-group button[class*=shrink]'
  )
  await expect(btn).toBeVisible()

  const before = await btn.getAttribute('class')
  await btn.click()
  await expect.poll(async () => btn.getAttribute('class'), { timeout: 10_000 }).not.toBe(before)

  const enteredFs = await page.evaluate(() => Boolean(document.fullscreenElement))
  if (enteredFs) {
    await page.keyboard.press('Escape')
    await expect(btn).toBeVisible()
  }
})

test.use({
  permissions: ['geolocation'],
  geolocation: { latitude: 23.75, longitude: 90.38, accuracy: 10 },
})
test('GeolocateControl centers map on (faked) user location', async ({ page }) => {
  // Default page + per-test context options: one window, review hold applies.
  // Headless-shell geolocation permission grants are unreliable — replace the
  // API outright with a deterministic position (no permission prompt path).
  await page.addInitScript(() => {
    const pos = () => ({
      coords: {
        latitude: 23.75,
        longitude: 90.38,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    })
    navigator.geolocation.getCurrentPosition = ok => ok(pos())
    navigator.geolocation.watchPosition = ok => (ok(pos()), 1)
  })
  await gotoCase(page, 'controls-camera/geolocate')

  // maplibre v6 attaches the click handler asynchronously (permissions query)
  // — wait for the enabled button or the click is silently dropped.
  const geoBtn = page.locator('button.maplibregl-ctrl-geolocate:not([disabled])')
  await geoBtn.waitFor({ timeout: 10_000 })
  await geoBtn.click()
  const [geo] = await waitForLog(page, 'geolocate')
  expect(geo.coords.lat).toBeCloseTo(23.75, 4)
  expect(geo.coords.lng).toBeCloseTo(90.38, 4)
  await page.waitForTimeout(1500)
  const state = await getMapState(page)
  expect(state.lat).toBeCloseTo(23.75, 2)
  expect(state.lng).toBeCloseTo(90.38, 2)
  // User-location dot + accuracy circle render (maplibre default elements)
  const dot = page.locator('.maplibregl-user-location-dot')
  await expect(dot).toBeVisible({ timeout: 10_000 })
})
