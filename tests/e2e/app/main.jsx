// E2E host app — Vite serves this via `playwright.config.ts` webServer.
// One page, one registry: /?case=<name> mounts the matching feature case.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'react-bkoi-gl/styles'
import 'maplibre-gl/dist/maplibre-gl.css'
import 'maplibre-gl-draw/dist/mapbox-gl-draw.css'
import './app.css'
import { CASES } from './cases'

// maplibre-gl v6 worker auto-detection breaks under Vite prebundling —
// same fix as the browser-mode setup and the README Turbopack section.
setWorkerUrl(workerUrl)

const params = new URLSearchParams(location.search)
const caseName = params.get('case')
const Case = caseName ? CASES[caseName] : null

// Shared test surface: every case can read/write these.
window.__LOG__ = []
window.__MAP__ = null
window.__pageErrors__ = []
window.__log = (entry) => window.__LOG__.push(entry)
window.addEventListener('error', (e) => window.__pageErrors__.push(String(e.message)))
window.addEventListener('unhandledrejection', (e) => window.__pageErrors__.push(String(e.reason)))

// Browsable index of all cases — `npm run e2e:serve` and open
// http://localhost:5175 to click through every scenario by hand.
function CaseIndex() {
  return (
    <div className="case-index">
      <h1>react-bkoi-gl e2e cases</h1>
      <p>
        Every README-claimed feature, one URL per case. The Playwright specs in
        <code> e2e/specs/ </code>drive these same pages.
      </p>
      <ul>
        {Object.keys(CASES).sort().map((name) => (
          <li key={name}>
            <a href={`/?case=${name}`}>{name}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}

const root = createRoot(document.getElementById('root'))

if (!caseName) {
  root.render(
    <StrictMode>
      <CaseIndex />
    </StrictMode>
  )
} else if (!Case) {
  document.getElementById('root').textContent = `Unknown case: ${caseName}`
} else {
  root.render(
    <StrictMode>
      <Case />
    </StrictMode>
  )
}
