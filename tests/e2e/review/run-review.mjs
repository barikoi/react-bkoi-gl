// Human review mode: ONE headed browser, one tab, walking through every e2e
// case grouped by module, with an on-screen banner (module, case, progress,
// what to look for), fake geolocation (so the geolocate dot shows), and a
// camera check on map/ref-methods (zoom in/out + fly actually verified).
//
// Usage:
//   npm run e2e:review                 # 10s dwell per case
// Usage (flags, via npm: `npm run e2e:review -- --dwell=30000`):
//   --dwell=30000   per-case dwell in ms (HUD hold bar drains over this)
//   --dwell=0       fast evidence-only pass, no hold
//   --pause         wait for Enter between cases instead of the timer
//   --only=map      one module or exact case id
//   --dwell 30000   space-separated form also works
// Env vars (DWELL / PAUSE / ONLY) still work for parity with the framework
// review runner.
//
// Requires the vite host app on :5175 (npm run e2e:serve) — reused if up.
import { chromium } from '@playwright/test'
import { headedContext, headedLaunch, hudHoldScript, mountHudScript } from '../../shared/review-banner.mjs'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'

const PORT = process.env.E2E_PORT || '5175'
// --- CLI flags (npm run e2e:review -- --dwell=30000 --pause --only=map) ---
const argv = process.argv.slice(2)
const flag = name => {
  const i = argv.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`))
  if (i === -1) return undefined
  const a = argv[i]
  if (a.includes('=')) return a.slice(a.indexOf('=') + 1)
  const next = argv[i + 1]
  return next && !next.startsWith('--') ? next : undefined
}
const DWELL = Number(flag('dwell') ?? process.env.DWELL ?? 10_000)
const PAUSE = argv.includes('--pause') || process.env.PAUSE === '1'
const ONLY = flag('only') ?? process.env.ONLY
const base = `http://localhost:${PORT}`

const registrySrc = readFileSync(new URL('../app/cases/index.js', import.meta.url), 'utf8')
const CASES = [...registrySrc.matchAll(/'([\w/-]+)':/g)].map(m => m[1])

// API key from the same .env the e2e app reads (vite loadEnv) — the alt-style
// demo builds style URLs with it (the style object itself carries no key).
const envKey = (() => {
  try {
    const m = readFileSync(new URL('../../../.env', import.meta.url), 'utf8').match(
      /^BARIKOI_API_KEY=(.*)$/m
    )
    return m?.[1]?.trim()
  } catch {
    return undefined
  }
})()

// Fail fast with an actionable message when the host app is not serving —
// otherwise the walker dies mid-run on ERR_CONNECTION_REFUSED and the headed
// browser just sits on error pages looking dead.
try {
  const res = await fetch(`${base}/`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
} catch {
  console.error(`\nHost app not reachable at ${base}\nStart it first:  npm run e2e:serve`)
  process.exit(1)
}

// Module grouping + human notes: what each case demonstrates (visual aid).
const MODULES = [
  [
    'map',
    [
      ['map/basic', 'Default map — Barikoi logo (bottom-left) + attribution (bottom-right)'],
      ['map/no-defaults', 'showAttribution=false (logo always renders)'],
      ['map/alt-style', 'osm_barikoi_v2 documented style'],
      ['map/controlled', 'Controlled viewState — click Move, camera jumps'],
      ['map/events', 'Click map → marker moves to clicked point'],
      ['map/events-extended', 'Drag / hover the circle / wheel-zoom / resize — events fire'],
      ['map/ref-methods', 'MapRef: Report, ZoomIn, ZoomOut, Fly — camera verified below'],
    ],
  ],
  [
    'marker-popup',
    [
      ['marker-popup/marker-basic', 'Default, draggable, custom-element markers'],
      ['marker-popup/popup-basic', 'Popup content, close button, closeOnClick'],
      ['marker-popup/popup-marker-attached', 'Popup anchored to marker'],
      ['marker-popup/marker-pulse', 'Pulsing marker — CSS keyframes via Marker children'],
    ],
  ],
  [
    'sources-layers',
    [
      ['sources-layers/geojson', 'GeoJSON → circle + fill + line layers'],
      ['sources-layers/data-driven', 'Data-driven styling + filter'],
      ['sources-layers/layer-events', 'Hover feature → state change; click → feature'],
      ['sources-layers/symbol-icon', 'Symbol layer — SDF icons from style sprite'],
      ['sources-layers/vector', 'Vector tiles — styled layers from the Barikoi style'],
      ['sources-layers/canvas', 'CanvasSource animated raster'],
    ],
  ],
  [
    'controls-camera',
    [
      ['controls-camera/navigation', 'Zoom in/out + compass'],
      ['controls-camera/camera-ref', 'MapRef: ZoomIn / ZoomOut / FlyTo'],
      ['controls-camera/scale', 'Scale bar — bottom-left ("2 km")'],
      ['controls-camera/fullscreen', 'Fullscreen toggle'],
      ['controls-camera/geolocate', 'Geolocate — dot + accuracy circle (fake location)'],
      ['controls-camera/all-controls', 'All controls, one per corner — uniform padding + stacking'],
    ],
  ],
  ['controls-globe', [['controls-globe/globe', 'Globe projection toggle']]],
  [
    'controls-minimap',
    [
      ['controls-minimap/minimap', 'Minimap (200x150) — full style, toggleable'],
      ['controls-minimap/minimap-rect', 'Minimap — parent viewport rectangle (parentRect)'],
    ],
  ],
  ['controls-terrain', [['controls-terrain/terrain', 'Terrain control (mount only)']]],
  ['draw', [['draw/all', 'Draw point/polygon, select, delete, advanced config']]],
  [
    'examples',
    [
      ['examples/animation', 'Animated marker along a route (rAF) — walker verifies it moves'],
      ['examples/animate-camera', 'Camera animation — orbit + flyover tour + reset (walker demos orbit)'],
      ['examples/camera-controls', 'fitBounds + setPitch/setBearing buttons'],
      ['examples/cluster', 'Clustered points (GeoJSON cluster)'],
      ['examples/heatmap', 'Heatmap layer'],
      ['examples/hillshade', 'Hillshade from open Terrarium DEM'],
      ['examples/video', 'Video source — aerial footage over SF'],
    ],
  ],
  [
    'advanced',
    [
      ['advanced/live-data', 'Live data — timer-driven setData appends points'],
      ['advanced/measure-distance', 'Measure distance — place A and B, haversine'],
      ['advanced/measure-area', 'Measure polygon area — spherical ring area'],
    ],
  ],
  [
    'hooks',
    [
      ['hooks/use-map', 'useMap drives the map from outside <Map>'],
      ['hooks/use-control', 'useControl custom IControl'],
    ],
  ],
  ['readme', [['readme-examples', 'Every README example mounted (runtime contract)']]],
]

const flat = MODULES.flatMap(([m, cs]) => cs)
const allIds = new Set(CASES)

// Per-case visible demos — the walker shows the feature working instead of
// just dwelling on it. Keep each demo short (≤ ~3s); the dwell continues
// afterwards. Returns null when a case has no demo.
const runDemo = async (id, page) => {
  const zoom = async () => page.evaluate(() => window.__MAP__.getZoom())
  try {
    if (id.endsWith('/navigation')) {
      const start = await zoom()
      await page.locator('.maplibregl-ctrl-zoom-in').click()
      await page.waitForTimeout(700)
      const afterIn = await zoom()
      await page.locator('.maplibregl-ctrl-zoom-out').click()
      await page.waitForTimeout(700)
      const afterOut = await zoom()
      return { label: 'zoom in/out', ok: afterIn > start && afterOut < afterIn }
    }
    if (id === 'controls-globe/globe') {
      // The case STARTS in globe projection — toggle out and back so the
      // viewer sees both states and it ends on the globe.
      const events = () => page.evaluate(() => (window.__LOG__ || []).filter(l => l.type === 'projection').length)
      const e0 = await events()
      await page.locator('.maplibregl-ctrl-globe').click()
      await page.waitForTimeout(900)
      await page.locator('.maplibregl-ctrl-globe').click()
      await page.waitForTimeout(900)
      const after = await page.evaluate(() => window.__MAP__.getProjection()?.type)
      const fired = (await events()) - e0
      return { label: `globe⇄mercator (now ${after})`, ok: after === 'globe' && fired >= 2 }
    }
    if (id === 'map/events') {
      // Click FAR from center (the marker starts at the map center — clicking
      // there moves it ~0px and looks broken) and assert the marker MOVES.
      const markerPos = () =>
        page.evaluate(() => {
          const m = document.querySelector('.maplibregl-marker')
          if (!m) return null
          const r = m.getBoundingClientRect()
          return [r.x + r.width / 2, r.y + r.height / 2]
        })
      const p0 = await markerPos()
      const c = await page.evaluate(() => {
        const r = document.querySelector('.maplibregl-map').getBoundingClientRect()
        return [r.x + r.width * 0.25, r.y + r.height * 0.3]
      })
      await page.mouse.click(c[0], c[1])
      await page.waitForTimeout(500)
      const p1 = await markerPos()
      const moved = p0 && p1 ? Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) : 0
      return { label: `click → marker moved ${Math.round(moved)}px`, ok: moved > 80 }
    }
    if (id === 'map/ref-methods') {
      // Fire EVERY control the case exposes: report, zoom-in, zoom-out, fly,
      // fitBounds — each verified, with camera-idle waits between actions
      // (a click mid-ease cancels the animation).
      const zoom = () => page.evaluate(() => window.__MAP__.getZoom())
      const center = () =>
        page.evaluate(() => {
          const c = window.__MAP__.getCenter()
          return [c.lng, c.lat]
        })
      const reports = () => page.evaluate(() => (window.__LOG__ || []).filter(l => l.type === 'ref-report').length)

      const r0 = await reports()
      await page.getByTestId('report').click()
      await page.waitForTimeout(300)
      const reportOk = (await reports()) > r0

      const z0 = await zoom()
      await page.getByTestId('zoom-in').click()
      await page.waitForTimeout(800)
      const z1 = await zoom()
      const zoomInOk = z1 > z0

      await page.getByTestId('zoom-out').click()
      await page.waitForTimeout(800)
      const z2 = await zoom()
      const zoomOutOk = z2 < z1

      await page.getByTestId('fly').click()
      await page.waitForTimeout(1200)
      const fc = await center()
      const fz = await zoom()
      const flyOk = Math.abs(fc[0] - 90.4) < 0.01 && Math.abs(fc[1] - 23.83) < 0.01

      await page.getByTestId('fit').click()
      await page.waitForTimeout(1200)
      const bc = await center()
      const bz = await zoom()
      // fitBounds lands on the box center (90.39, 23.825) and re-frames away
      // from the fly zoom (on wide viewports that can zoom IN, not out).
      const fitOk = Math.abs(bc[0] - 90.39) < 0.01 && Math.abs(bc[1] - 23.825) < 0.01 && Math.abs(bz - fz) > 0.3

      const steps = [
        ['report', reportOk],
        ['zoomIn', zoomInOk],
        ['zoomOut', zoomOutOk],
        ['fly', flyOk],
        ['fitBounds', fitOk],
      ]
      return {
        label: steps.map(([n, ok]) => `${n}${ok ? '✓' : '✗'}`).join(' '),
        ok: steps.every(([, ok]) => ok),
      }
    }
    if (id === 'advanced/measure-area') {
      // Button-driven: each Add vertex click extends the fixed ring; area
      // logs once 3+ vertices exist.
      const areas = () => page.evaluate(() => (window.__LOG__ || []).filter(l => l.type === 'area').length)
      const a0 = await areas()
      for (let i = 0; i < 3; i++) {
        await page.getByTestId('add-vertex').click()
        await page.waitForTimeout(300)
      }
      await page.waitForTimeout(400)
      const fired = (await areas()) > a0
      return { label: `3 vertices → area${fired ? '✓' : ' NOT logged'}`, ok: fired }
    }
    if (id === 'controls-camera/all-controls') {
      const st = await page.evaluate(() => {
        const corners = {}
        for (const corner of ['top-left', 'top-right', 'bottom-left', 'bottom-right']) {
          const el = document.querySelector(`.maplibregl-ctrl-${corner}`)
          corners[corner] = el ? el.querySelectorAll(':scope > .maplibregl-ctrl').length : 0
        }
        return {
          corners,
          draw: !!document.querySelector('[class*=mapbox-gl-draw]'),
          geolocate: !!document.querySelector('.maplibregl-ctrl-geolocate'),
          navigation: !!document.querySelector('.maplibregl-ctrl-zoom-in'),
          scale: !!document.querySelector('.maplibregl-ctrl-scale'),
          fullscreen: !!document.querySelector('button[class*=fullscreen], button[class*=shrink]'),
          globe: !!document.querySelector('.maplibregl-ctrl-globe'),
          terrain: !!document.querySelector('.maplibregl-ctrl-terrain'),
          minimap: !!document.querySelector('.maplibregl-ctrl-minimap'),
        }
      })
      const features = ['draw', 'geolocate', 'navigation', 'scale', 'fullscreen', 'globe', 'terrain', 'minimap']
      const missing = features.filter(f => !st[f])
      const allCorners = Object.values(st.corners).every(n => n > 0)
      return {
        label: `8 features${missing.length ? ' MISSING ' + missing.join(',') : ''}, corners ${JSON.stringify(st.corners)}`,
        ok: missing.length === 0 && allCorners,
      }
    }
    if (id === 'marker-popup/popup-basic') {
      await page.locator('.maplibregl-popup-close-button').click()
      await page.waitForTimeout(400)
      const closed = (await page.locator('.maplibregl-popup').count()) === 0
      await page.getByTestId('reopen').click().catch(() => {})
      await page.waitForTimeout(400)
      const reopened = (await page.locator('.maplibregl-popup').count()) > 0
      return { label: `popup closed${closed ? '' : ' FAILED'} + reopened${reopened ? '' : ' FAILED'}`, ok: closed && reopened }
    }
    if (id === 'examples/camera-controls') {
      const z0 = await zoom()
      await page.getByTestId('fit-bangladesh').click()
      await page.waitForTimeout(1400)
      const z1 = await zoom()
      await page.getByTestId('pitch').click()
      await page.waitForTimeout(700)
      const pitch = await page.evaluate(() => window.__MAP__.getPitch())
      const b0 = await page.evaluate(() => window.__MAP__.getBearing())
      await page.getByTestId('bearing').click()
      await page.waitForTimeout(900)
      const b1 = await page.evaluate(() => window.__MAP__.getBearing())
      return {
        label: `fit ${z0.toFixed(1)}→${z1.toFixed(1)}, pitch ${Math.round(pitch)}°, bearing ${Math.round(b0)}°→${Math.round(b1)}°`,
        ok: Math.abs(z1 - z0) > 0.5 && pitch > 30 && Math.abs(b1 - b0) > 5,
      }
    }
    if (id === 'sources-layers/layer-events') {
      const pt = await page.evaluate(() => {
        const m = window.__MAP__
        const f = m.queryRenderedFeatures({ layers: ['places-layer'] })[0]
        if (!f) return null
        const p = m.project(f.geometry.coordinates)
        return [p.x, p.y]
      })
      if (!pt) return { label: 'hover', ok: false, detail: 'no rendered feature' }
      const before = await page.evaluate(() => (window.__LOG__ || []).filter(l => l.type === 'layer-enter').length)
      await page.mouse.move(pt[0], pt[1])
      await page.waitForTimeout(600)
      const entered = await page.evaluate(() => (window.__LOG__ || []).filter(l => l.type === 'layer-enter').length)
      return { label: `hover→layer-enter${entered > before ? '✓' : '✗'}`, ok: entered > before }
    }
    if (id === 'hooks/use-control') {
      const read = () => page.getByTestId('zoom-readout').textContent()
      const t0 = await read()
      await page.evaluate(() => window.__MAP__.zoomIn())
      await page.waitForTimeout(900)
      const t1 = await read()
      return { label: `zoom readout ${t0} → ${t1}`, ok: t0 !== t1 && t1.includes('Zoom') }
    }
    if (id === 'examples/video') {
      const v = await page.evaluate(() => {
        const s = window.__MAP__.getSource('drone')
        const el = s.video || s._video
        if (!el) return null
        const coords = s.coordinates || s._options?.coordinates
        const q = coords.map(c => {
          const p = window.__MAP__.project(c)
          return [p.x, p.y]
        })
        const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])
        return {
          vw: el.videoWidth,
          vh: el.videoHeight,
          ready: el.readyState,
          quadAspect: len(q[0], q[1]) / len(q[0], q[3]),
          // axis-aligned: top edge horizontal, left edge vertical
          axisAligned:
            Math.abs(coords[0][1] - coords[1][1]) < 1e-9 &&
            Math.abs(coords[0][0] - coords[3][0]) < 1e-9,
        }
      })
      if (!v || !v.vw) return { label: 'video', ok: false, detail: 'video element not loaded' }
      const videoAspect = v.vw / v.vh
      const ok = v.ready >= 2 && v.axisAligned && Math.abs(v.quadAspect - videoAspect) / videoAspect < 0.05
      return {
        label: `${v.vw}×${v.vh} (aspect ${videoAspect.toFixed(2)}) on quad ${v.quadAspect.toFixed(2)}, north-up${ok ? '' : ' — MISMATCH'}`,
        ok,
      }
    }
    if (id === 'map/alt-style') {
      // osm_barikoi_v2 is visually near-identical to the default osm-liberty —
      // swap to the documented dark style and back so the change is VISIBLE.
      if (!envKey) return { label: 'style swap', ok: false, detail: 'BARIKOI_API_KEY missing in .env' }
      const name = () => page.evaluate(() => window.__MAP__.getStyle().name)
      const swap = async style => {
        await page.evaluate(
          ({ u, key }) => window.__MAP__.setStyle(`https://map.barikoi.com/styles/${u}/style.json?key=${key}`),
          { u: style, key: envKey }
        )
        await page.waitForFunction(() => window.__MAP__.isStyleLoaded(), null, { timeout: 15000 })
        await page.waitForTimeout(600)
      }
      const before = await name()
      await swap('barikoi-dark-mode')
      const dark = await name()
      await swap('osm_barikoi_v2')
      const after = await name()
      return { label: `style ${before} → ${dark} → ${after}`, ok: dark !== before && after === before }
    }
    if (id === 'map/controlled') {
      const c0 = await page.evaluate(() => {
        const c = window.__MAP__.getCenter()
        return [c.lng, c.lat]
      })
      await page.getByTestId('move').click()
      await page.waitForTimeout(1200)
      const c1 = await page.evaluate(() => {
        const c = window.__MAP__.getCenter()
        return [c.lng, c.lat]
      })
      return {
        label: `Move → camera jumped to ${c1[0].toFixed(2)},${c1[1].toFixed(2)}`,
        ok: Math.abs(c1[0] - c0[0]) > 0.1,
      }
    }
    if (id === 'map/events-extended') {
      // The case logs dragstart/drag/dragend, movestart, zoomstart (see
      // map.jsx) — mirror the spec's real-input pattern.
      const count = t => page.evaluate(type => (window.__LOG__ || []).filter(l => l.type === type).length, t)
      const d0 = await count('dragend')
      const z0 = await count('zoomstart')
      const box = await page.locator('canvas').boundingBox()
      const cx = box.x + box.width / 2
      const cy = box.y + box.height / 2
      await page.mouse.move(cx, cy)
      await page.mouse.down()
      await page.mouse.move(cx - 80, cy - 60, { steps: 5 })
      await page.mouse.up()
      await page.waitForTimeout(500)
      await page.mouse.move(cx, cy)
      await page.mouse.wheel(0, -240)
      await page.waitForTimeout(800)
      const dragged = (await count('dragend')) > d0
      const zoomed = (await count('zoomstart')) > z0
      return { label: `drag→dragend${dragged ? '✓' : '✗'} wheel→zoomstart${zoomed ? '✓' : '✗'}`, ok: dragged && zoomed }
    }
    if (id === 'controls-camera/fullscreen') {
      const btnClass = page.locator(
        '.maplibregl-ctrl-group button[class*=fullscreen], .maplibregl-ctrl-group button[class*=shrink]'
      )
      const before = await btnClass.getAttribute('class')
      await btnClass.click()
      await page.waitForTimeout(1000)
      const after = await btnClass.getAttribute('class')
      const entered = await page.evaluate(() => Boolean(document.fullscreenElement))
      if (entered) {
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)
      }
      return { label: `fullscreen class swap${after !== before ? '' : ' FAILED'}`, ok: after !== before }
    }
    if (id === 'hooks/use-map') {
      const start = await zoom()
      await page.getByTestId('zoom-in').click()
      await page.waitForTimeout(600)
      const after = await zoom()
      await page.getByTestId('fly').click()
      await page.waitForTimeout(900)
      const center = await page.evaluate(() => {
        const c = window.__MAP__.getCenter()
        return [c.lng, c.lat]
      })
      return {
        label: `useMap zoomIn (${start.toFixed(0)}→${after.toFixed(0)}) + flyTo`,
        ok: after > start && Math.abs(center[0] - 90.4) < 0.05,
      }
    }
    if (id === 'marker-popup/marker-basic') {
      const box = await page.locator('.maplibregl-marker-draggable').boundingBox()
      if (!box) return { label: 'draggable marker', ok: false }
      const cx = box.x + box.width / 2
      const cy = box.y + box.height / 2
      await page.mouse.move(cx, cy)
      await page.mouse.down()
      await page.mouse.move(cx + 160, cy - 110, { steps: 10 })
      await page.mouse.up()
      await page.waitForTimeout(400)
      const moved = await page.evaluate(
        ([x, y]) => {
          const el = document.querySelector('.maplibregl-marker-draggable')
          const r = el.getBoundingClientRect()
          return Math.hypot(r.x + r.width / 2 - x, r.y + r.height / 2 - y)
        },
        [cx, cy]
      )
      return { label: `marker dragged ${Math.round(moved)}px`, ok: moved > 50 }
    }
    if (id === 'draw/all') {
      await page.locator('.mapbox-gl-draw_polygon').click()
      await page.waitForTimeout(300)
      const c = await page.evaluate(() => {
        const r = document.querySelector('.maplibregl-map').getBoundingClientRect()
        return [r.x + r.width / 2, r.y + r.height / 2]
      })
      for (const [dx, dy] of [[-120, -60], [120, -60], [0, 80]]) {
        await page.mouse.click(c[0] + dx, c[1] + dy)
        await page.waitForTimeout(150)
      }
      await page.mouse.dblclick(c[0], c[1] + 80)
      await page.waitForTimeout(600)
      const created = await page.evaluate(() => (window.__LOG__ || []).some(l => l.type === 'create'))
      return { label: 'polygon drawn', ok: created }
    }
    if (id === 'examples/animation') {
      const pos = () =>
        page.evaluate(() => {
          const m = document.querySelector('.maplibregl-marker')
          if (!m) return null
          const r = m.getBoundingClientRect()
          return [r.x, r.y]
        })
      const p0 = await pos()
      await page.waitForTimeout(1500)
      const p1 = await pos()
      const moved = p0 && p1 ? Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) : 0
      return { label: `marker animated ${Math.round(moved)}px`, ok: moved > 10 }
    }
    if (id === 'examples/animate-camera') {
      const b0 = await page.evaluate(() => window.__MAP__.getBearing())
      await page.getByTestId('orbit').click()
      await page.waitForTimeout(1500)
      const b1 = await page.evaluate(() => window.__MAP__.getBearing())
      await page.getByTestId('reset').click().catch(() => {})
      await page.waitForTimeout(400)
      return { label: `orbit ${Math.round(b0)}°→${Math.round(b1)}°`, ok: Math.abs(b1 - b0) > 2 }
    }
  } catch (e) {
    return { label: 'demo threw', ok: false, detail: String(e).split('\n')[0] }
  }
  return null
}

const planned = flat.filter(([id]) => !ONLY || id.startsWith(ONLY))
const missing = ONLY ? [] : CASES.filter(c => !flat.some(([id]) => id === c))

// Visual banner + bottom-center HUD come from tests/shared/review-banner.mjs
// (single source of truth, shared with the framework review runner).

const browser = await chromium.launch(headedLaunch)
const context = await browser.newContext(headedContext)
// Fake geolocation so the geolocate control shows its dot + accuracy circle.
await context.grantPermissions(['geolocation'], { origin: base })
await context.setGeolocation({ latitude: 23.75, longitude: 90.38, accuracy: 30 })
const page = await context.newPage()
// Raise the tab within its window — combined with the anti-throttling launch
// flags this keeps the review painting even when the window is covered.
await page.bringToFront().catch(() => {})

const results = []
const total = planned.length + missing.length
let n = 0

for (const [module, cases] of MODULES) {
  const todo = cases.filter(([id]) => planned.some(([p]) => p === id))
  if (!todo.length) continue
  console.log(`\n━━ ${module}`)

  for (const [id] of todo) {
    n += 1
    process.stdout.write(`  ▶ ${id} … `)
    const errors = []
    page.removeAllListeners('pageerror')
    page.on('pageerror', e => errors.push(String(e)))

    await page.goto(`${base}/?case=${id}`, { waitUntil: 'domcontentloaded' })
    let mapReady = false
    if (id === 'readme-examples') {
      // Browsable index without ?example= — no map to wait for; the spec
      // iterates single examples via the URL param.
      mapReady = true
    } else {
      try {
        await page.waitForFunction(
          () => Boolean(window.__MAP__ && window.__MAP__.isStyleLoaded()),
          null,
          { timeout: 30000 }
        )
        mapReady = true
      } catch {
        errors.push('map did not load within 30s')
      }
    }
    const secLoc = page.locator('body')

    // Mount the HUD pill FIRST so the visible interactions below (camera
    // check, demos) happen while it is on screen — otherwise they fire during
    // load and are easy to miss.
    await page.evaluate(mountHudScript({ label: id })).catch(() => {})

    // Camera verification for the ref-methods case (zoom in/out + fly).
    let camera = null
    if (id.endsWith('camera-ref') && mapReady) {
      const zoom = async () => page.evaluate(() => window.__MAP__.getZoom())
      const start = await zoom()
      await page.getByTestId('zoom-in').click()
      await page.waitForTimeout(600)
      const afterIn = await zoom()
      await page.getByTestId('zoom-out').click()
      await page.waitForTimeout(600)
      const afterOut = await zoom()
      await page.getByTestId('fly').click()
      await page.waitForTimeout(1600)
      const afterFly = await page.evaluate(() => {
        const c = window.__MAP__.getCenter()
        return { lng: c.lng, lat: c.lat, zoom: window.__MAP__.getZoom() }
      })
      camera = {
        zoomStart: start,
        afterZoomIn: afterIn,
        afterZoomOut: afterOut,
        afterFly,
        zoomInWorks: afterIn > start,
        zoomOutWorks: afterOut < afterIn,
        flyWorks: Math.abs(afterFly.lng - 90.4) < 0.01 && afterFly.zoom > afterOut,
      }
    }

    // Visible per-case demo — the walker demonstrates the feature instead of
    // just dwelling on it (see runDemo).
    const demo = mapReady ? await runDemo(id, page) : null

    // Activate geolocate so the user-location dot + accuracy circle show.
    // The click listener is attached asynchronously (maplibre v6 wires it in
    // _finishSetupUI after a permissions query) — wait for the enabled button
    // before clicking, or the click is silently dropped.
    if (id.endsWith('/geolocate') && mapReady) {
      await secLoc.scrollIntoViewIfNeeded().catch(() => {})
      const btn = page.locator('button.maplibregl-ctrl-geolocate:not([disabled])')
      await btn.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})
      await page
        .locator('button.maplibregl-ctrl-geolocate:not([disabled])')
        .click()
        .catch(() => {})
      await page.waitForTimeout(1500)
    }

    // Bottom-center "Rendering · <case>" pill is the only on-screen UI;
    // window title carries the progress counter.
    await page.evaluate((t) => { document.title = t }, `▶ ${module} — ${id} (${n}/${total})`).catch(() => {})

    const evidence = await page
      .evaluate(() => {
        const logo = document.querySelector('a.maplibregl-ctrl-logo')
        const attrib = document.querySelector('.maplibregl-ctrl-attrib')
        const scale = document.querySelector('.maplibregl-ctrl-scale')
        const minimap = document.querySelector('.maplibregl-ctrl-minimap')
        const geo = document.querySelector('.maplibregl-ctrl-geolocate')
        const dot = document.querySelector('.maplibregl-user-location-dot')
        return {
          canvas: !!document.querySelector('canvas'),
          logo: logo
            ? {
                painted: getComputedStyle(logo).backgroundImage !== 'none',
                box: `${logo.offsetWidth}x${logo.offsetHeight}`,
              }
            : null,
          attribution: attrib
            ? (attrib.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80)
            : null,
          scale: scale ? scale.textContent.trim() : null,
          minimap: minimap ? `${minimap.offsetWidth}x${minimap.offsetHeight}` : null,
          geolocateBtn: !!geo,
          geolocateDot: !!dot,
          pageErrors: window.__pageErrors__ || [],
        }
      })
      .catch(() => null)

    if (DWELL > 0) {
      if (PAUSE) {
        process.stdout.write('loaded — press Enter for next … ')
        await new Promise(r => process.stdin.once('data', r))
      } else {
        // Hold with the draining progress bar (same as the framework review);
        // resolves when the bar empties, i.e. after the full DWELL.
        await page.evaluate(hudHoldScript(DWELL)).catch(() => {})
      }
    }

    const probs = [...errors, ...(evidence?.pageErrors || [])]
    if (camera && !(camera.zoomInWorks && camera.zoomOutWorks && camera.flyWorks))
      probs.push('camera check failed')
    if (demo && !demo.ok) probs.push(`demo failed: ${demo.label}${demo.detail ? ` (${demo.detail})` : ''}`)
    const ok = mapReady && probs.length === 0
    results.push({ id, module, ok, evidence, camera, demo, errors: probs })
    console.log(ok ? 'OK' : `PROBLEM (${probs.join('; ')})`)
    const e = evidence || {}
    console.log(
      `     logo=${JSON.stringify(e.logo)} attrib="${e.attribution}" scale=${JSON.stringify(e.scale)}` +
        ` minimap=${JSON.stringify(e.minimap)} geoDot=${e.geolocateDot}` +
        (camera
          ? ` camera=${camera.zoomInWorks && camera.zoomOutWorks && camera.flyWorks ? 'zoomIn/zoomOut/fly ✓' : JSON.stringify(camera)}`
          : '') +
        (demo ? ` demo=${demo.ok ? `${demo.label} ✓` : JSON.stringify(demo)}` : '')
    )
  }
}

for (const id of missing) {
  console.log(`  ⚠ ${id} not in review modules — run separately`)
  results.push({
    id,
    module: '(unlisted)',
    ok: null,
    evidence: null,
    camera: null,
    errors: ['not in review modules'],
  })
}

await browser.close()

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
mkdirSync('tests/e2e/report', { recursive: true })
const out = `tests/e2e/report/review-${stamp}.json`
writeFileSync(
  out,
  JSON.stringify({ ranAt: new Date().toISOString(), dwell: DWELL, results }, null, 2)
)

const failed = results.filter(r => r.ok === false)
console.log(
  `\n${results.filter(r => r.ok !== null).length} cases reviewed — ${results.filter(r => r.ok).length} OK, ${failed.length} problems`
)
if (failed.length) console.log('Problems:', failed.map(f => f.id).join(', '))
console.log(`Report: ${out}`)
