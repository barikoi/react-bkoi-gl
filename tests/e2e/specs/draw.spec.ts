// README claims: DrawControl — point/line/polygon creation, selection,
// update (drag), deletion, event callbacks, style prop, controls config.
// One test = one window: a headed review must not re-render the same URL
// once per assertion group.
import { test, expect, gotoCase, waitForLog, section } from '../fixtures/map.js'

async function drawReady(page) {
  // maplibre-gl-draw connects lazily (16ms loaded() poll); its cold source is
  // the concrete readiness signal — same gate as the browser-mode spec.
  await expect
    .poll(() => page.evaluate(() => Boolean(window.__MAP__?.getSource('mapbox-gl-draw-cold'))), {
      timeout: 20_000,
    })
    .toBeTruthy()
}

async function center(page) {
  const box = await page.locator('canvas').boundingBox()
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

// Click a draw tool and WAIT for it to activate — the mode switch is async,
// and a canvas click landing before it creates a feature in the previous
// mode (a stray point instead of a line vertex).
async function activateTool(page, tool) {
  const btn = page.locator(tool)
  await btn.click()
  await expect(btn).toHaveClass(/active/)
}

test('draw/basic: toolbar + style + point/line/polygon + select/update/delete', async ({
  page,
}) => {
  await gotoCase(page, 'draw/basic')
  await drawReady(page)
  const { x, y } = await center(page)

  // Toolbar: configured tools render, disabled tools absent
  await expect(page.locator('.mapbox-gl-draw_point')).toBeVisible()
  await expect(page.locator('.mapbox-gl-draw_polygon')).toBeVisible()
  await expect(page.locator('.mapbox-gl-draw_line')).toBeVisible()
  await expect(page.locator('.mapbox-gl-draw_trash')).toBeVisible()
  await expect(page.locator('.mapbox-gl-draw_combine')).toHaveCount(0)

  // style prop lands on the control container
  const group = page.locator('.maplibregl-ctrl-top-left .maplibregl-ctrl-group')
  const styles = await group.evaluate(el => ({
    opacity: el.style.opacity,
    zIndex: el.style.zIndex,
  }))
  expect(styles.opacity).toBe('0.9')
  expect(styles.zIndex).toBe('5')

  // Point: tool → canvas click → onDrawCreate
  await activateTool(page, '.mapbox-gl-draw_point')
  await page.mouse.click(x, y)
  let creates = await waitForLog(page, 'create')
  expect(creates[0].features).toContain('Point')

  // Drag the auto-selected point → onDrawUpdate (feature moved).
  // Creation auto-selects (simple_select), so drag straight away; a click
  // at the drag target afterwards does NOT reselect reliably — delete while
  // still selected instead.
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 80, y + 60, { steps: 6 })
  await page.mouse.up()
  const updates = await waitForLog(page, 'update')
  expect(updates[0].features).toContain('Point')

  // Trash while the point is still selected → onDrawDelete (whole feature;
  // trash in direct_select on a polygon only deletes the active vertex)
  await page.locator('.mapbox-gl-draw_trash').click()
  const deletes = await waitForLog(page, 'delete')
  expect(deletes[0].features).toContain('Point')

  // LineString: two clicks + double-click finishes → onDrawCreate
  await activateTool(page, '.mapbox-gl-draw_line')
  await page.mouse.click(x - 160, y - 40)
  await page.mouse.click(x + 40, y + 40)
  await page.mouse.dblclick(x + 160, y - 60)
  creates = await waitForLog(page, 'create')
  const last = creates[creates.length - 1]
  expect(last.features).toContain('LineString')

  // Polygon: three clicks + double-click closes → onDrawCreate; the
  // completion auto-select fires onDrawSelectionChange with the new feature
  await activateTool(page, '.mapbox-gl-draw_polygon')
  await page.mouse.click(x - 100, y - 60)
  await page.mouse.click(x + 100, y - 60)
  await page.mouse.click(x, y + 80)
  await page.mouse.dblclick(x, y + 80)
  creates = await waitForLog(page, 'create')
  const lastCreate = creates[creates.length - 1]
  expect(lastCreate.features).toContain('Polygon')
  // The polygon's completion auto-select fires onDrawSelectionChange —
  // poll for THAT event: a generic count-wait resolves on earlier
  // point/line selections before the polygon's event arrives (headed is
  // slower to dispatch).
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          window.__LOG__.some(l => l.type === 'selectionchange' && l.features?.includes('Polygon'))
        ),
      { timeout: 15_000 }
    )
    .toBe(true)

  // Point deleted; line and polygon survive. Poll — the rendered draw
  // layers update a frame after the delete event.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const m = window.__MAP__
          const q = ids =>
            ids.reduce(
              (n, id) => n + m.queryRenderedFeatures(undefined, { layers: [id] }).length,
              0
            )
          return {
            // point-ACTIVE layers also carry the selected polygon's vertex
            // handles — count only real unselected points
            points: q(['gl-draw-point-inactive.cold', 'gl-draw-point-inactive.hot']),
            lines: q([
              'gl-draw-line-inactive.cold',
              'gl-draw-line-active.cold',
              'gl-draw-line-inactive.hot',
              'gl-draw-line-active.hot',
            ]),
            polys: q([
              'gl-draw-polygon-fill-inactive.cold',
              'gl-draw-polygon-fill-active.cold',
              'gl-draw-polygon-fill-inactive.hot',
              'gl-draw-polygon-fill-active.hot',
            ]),
          }
        }),
      { timeout: 15_000 }
    )
    .toEqual({ points: 0, lines: 1, polys: 1 })
})

test('draw/advanced: default toolbar + custom styles + mode change events', async ({ page }) => {
  await gotoCase(page, 'draw/advanced')
  await drawReady(page)

  // displayControlsDefault: the full toolbar renders, including tools that
  // draw/basic explicitly disables
  await expect(page.locator('.mapbox-gl-draw_combine')).toBeVisible()
  await expect(page.locator('.mapbox-gl-draw_polygon')).toBeVisible()
  await expect(page.locator('.mapbox-gl-draw_uncombine')).toBeVisible()

  // Custom `styles` array: the custom point layer carries our paint color
  // (draw layers add asynchronously — poll, don't read once)
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const layer = window.__MAP__
            .getStyle()
            .layers.find(l => l.id.startsWith('gl-draw-custom-point'))
          return layer?.paint?.['circle-color'] ?? ''
        }),
      { timeout: 15_000 }
    )
    .toBe('#e6a817')

  // Selecting a tool fires onDrawModeChange with the draw mode
  await page.locator('.mapbox-gl-draw_point').click()
  const [mode] = await waitForLog(page, 'draw-modechange')
  expect(mode.mode).toBe('draw_point')
})

// The advanced toolbar (displayControlsDefault) includes trash — cover the
// delete path here too: draw a point, delete it via the toolbar.
test('draw/advanced: trash deletes a drawn feature', async ({ page }) => {
  await gotoCase(page, 'draw/advanced')
  await drawReady(page)
  const { x, y } = await center(page)

  await activateTool(page, '.mapbox-gl-draw_point')
  await page.mouse.click(x, y)
  await waitForLog(page, 'create')

  // Click the point to select it (simple_select), then trash → delete
  await page.mouse.click(x, y)
  await waitForLog(page, 'selectionchange')
  await page.locator('.mapbox-gl-draw_trash').click()
  const deletes = await waitForLog(page, 'delete')
  expect(deletes[0].features).toContain('Point')
})
