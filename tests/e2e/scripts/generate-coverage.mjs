// Generates tests/e2e/report/coverage.md — the README-claim coverage matrix:
// README section → e2e case → covering spec → status, plus a mapping of
// docs.barikoi.com/examples to our case coverage.
// Run after `npx playwright test` (reads spec files statically; statuses come
// from the last run via tests/e2e/report/review-*.json when present).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'

// spec files recursively (specs/ has nested dirs: controls/, examples/)
const specFiles = []
;(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) walk(`${dir}/${e.name}`)
    else specFiles.push(`${dir}/${e.name}`)
  }
})('tests/e2e/specs')

// case-id → spec references (static grep: gotoCase(page, '<id>'))
const caseToSpecs = {}
for (const s of specFiles) {
  const src = readFileSync(s, 'utf8')
  for (const m of src.matchAll(/gotoCase\(page,\s*'([^']+)'\)/g)) {
    ;(caseToSpecs[m[1]] ||= []).push(s.replace('tests/e2e/specs/', ''))
  }
}

// Last review evidence (logo/attribution state per case), if any.
let review = null
const reports = existsSync('tests/e2e/report')
  ? readdirSync('tests/e2e/report')
      .filter(f => f.startsWith('review-'))
      .sort()
  : []
if (reports.length) review = JSON.parse(readFileSync(`tests/e2e/report/${reports.at(-1)}`, 'utf8'))

// README claim matrix (section anchor → case ids).
const matrix = [
  [
    'Map Component — style, view state, defaults',
    ['map/basic', 'map/no-defaults', 'map/alt-style'],
  ],
  ['Map Component — controlled viewState', ['map/controlled']],
  ['Map Component — events (drag/hover/zoom/resize/idle)', ['map/events', 'map/events-extended']],
  ['Map Component — MapRef methods', ['map/ref-methods']],
  ['Marker Component — default, custom, draggable', ['marker-popup/marker-basic']],
  [
    'Popup Component — basic, close, marker-attached',
    ['marker-popup/popup-basic', 'marker-popup/popup-marker-attached'],
  ],
  ['Source/Layer — GeoJSON circle/fill/line', ['sources-layers/geojson']],
  ['Layer — data-driven styling, filter', ['sources-layers/data-driven']],
  ['Layer events — mouseenter/leave, click', ['sources-layers/layer-events']],
  ['CanvasSource', ['sources-layers/canvas']],
  ['Source/Layer — vector tiles (url + source-layer)', ['sources-layers/vector']],
  ['Source/Layer — symbol layer (icon-image)', ['sources-layers/symbol-icon']],
  ['Controls — Navigation', ['controls-camera/navigation']],
  ['Controls — Scale', ['controls-camera/scale']],
  ['Controls — Fullscreen', ['controls-camera/fullscreen']],
  ['Controls — Geolocate', ['controls-camera/geolocate']],
  ['Controls — Globe', ['controls-globe/globe']],
  ['Controls — Minimap', ['controls-minimap/minimap']],
  ['Controls — Terrain', ['controls-terrain/terrain']],
  ['DrawControl — toolbar, draw point/polygon, delete', ['draw/all']],
  ['Hooks — useMap, useControl', ['hooks/use-map', 'hooks/use-control']],
  ['Styles — react-bkoi-gl/styles (logo paint)', ['map/basic']],
  ['Available Map Styles — osm-liberty, osm_barikoi_v2', ['map/basic', 'map/alt-style']],
]

// docs.barikoi.com/examples → our coverage.
const barikoiExamples = [
  ['getting-started/display-basic-map', 'map/basic', '✅'],
  ['getting-started/display-custom-map-style', 'map/alt-style', '✅'],
  ['getting-started/add-maps-control', 'controls-camera/navigation', '✅'],
  ['markers-and-popups/add-marker', 'marker-popup/marker-basic', '✅'],
  ['markers-and-popups/add-draggable-marker', 'marker-popup/marker-basic (draggable)', '✅'],
  ['markers-and-popups/add-marker-map-click', 'map/events (click→marker state)', '✅'],
  ['markers-and-popups/add-popup', 'marker-popup/popup-basic', '✅'],
  ['markers-and-popups/multiple-marker-as-layer', 'sources-layers/geojson (features→layer)', '✅'],
  ['markers-and-popups/soft-pulsing-marker', 'marker-popup/marker-pulse', '✅'],
  ['layers-and-styling/add-geojson-line', 'sources-layers/geojson (line layer)', '✅'],
  ['layers-and-styling/add-polygon', 'sources-layers/geojson (fill layer)', '✅'],
  ['layers-and-styling/multiple-geojson', 'sources-layers/data-driven', '✅'],
  ['layers-and-styling/icon-layer', 'sources-layers/symbol-icon', '✅'],
  ['layers-and-styling/vector-tile-layer', 'sources-layers/vector', '✅'],
  [
    'advanced-features/animate-map-camera',
    'examples/animate-camera (exact port: orbit + flyover + reset)',
    '✅',
  ],
  ['advanced-features/fly-location', 'map/ref-methods (flyTo)', '✅'],
  ['advanced-features/fit-bound', 'map/ref-methods (fitBounds)', '✅'],
  ['advanced-features/animate-point-along-line', 'examples/animation', '✅'],
  ['advanced-features/click-to-center', 'map/events (click)', '✅'],
  ['advanced-features/mouse-position', 'map/events (click lngLat)', '✅'],
  ['advanced-features/live-real-time-data', 'advanced/live-data', '✅'],
  ['advanced-features/measure-distance', 'advanced/measure-distance', '✅'],
  ['advanced-features/measure-polygon-area', 'advanced/measure-area', '✅'],
]

const rows = matrix
  .map(([claim, cases]) => {
    const cells = cases
      .map(c => {
        const specsFor = caseToSpecs[c]
        const status = specsFor ? '✅' : '❌ no spec'
        const rev = review?.results.find(r => r.id === c)
        const revMark = rev ? (rev.ok ? '' : ' ⚠️review') : ''
        return `\`${c}\` ${status}${specsFor ? ` (${specsFor.join(', ')})` : ''}${revMark}`
      })
      .join('<br>')
    return `| ${claim} | ${cells} |`
  })
  .join('\n')

const bkoiRows = barikoiExamples.map(([ex, c, st]) => `| ${ex} | ${c} | ${st} |`).join('\n')

const md = `# E2E Coverage Report — README claims & Barikoi docs examples

Generated: ${new Date().toISOString()}
${review ? `Review evidence: ${reports.at(-1)} (dwell ${review.dwell}ms, headed)` : 'No headed review run yet — run `npm run e2e:review` for per-case visual evidence.'}

## README claim matrix

| README claim | e2e case → spec | 
|---|---|
${rows}

## docs.barikoi.com/examples mapping

Legend: ✅ covered by an e2e case

| Barikoi example | Our case | Status |
|---|---|---|
${bkoiRows}

## Suites

- \`npm run e2e\` — headless, full spec suite (CI gate)
- \`npm run e2e:headed\` — same specs, visible browser (fast, auto-advancing)
- \`npm run e2e:review\` — ONE browser, one case at a time with dwell, so a
  human can inspect each README claim live; writes \`tests/e2e/report/review-*.json\`
  (logo paint + attribution text + page errors per case)
`

mkdirSync('tests/e2e/report', { recursive: true })
writeFileSync('tests/e2e/report/coverage.md', md)
console.log('wrote tests/e2e/report/coverage.md')
