#!/usr/bin/env node
/**
 * Framework review mode — headed human walkthrough of every framework app,
 * mirroring the e2e review UX (one browser, one app at a time, bottom-center
 * HUD pill with a draining 10s hold bar, evidence screenshots, summary).
 *
 * Two phases, so transitions between cells are INSTANT:
 *   1. prepare — install + build every selected cell, renaming each build
 *      output into a snapshot slot (.fw-snap/<cell>)
 *   2. walkthrough — serve each snapshot, show it headed, 10s hold, next
 *
 * Usage:
 *   npm run test:framework:review                  # 10s dwell per app build
 *   DWELL=20000 npm run test:framework:review      # longer dwell
 *   PAUSE=1 npm run test:framework:review          # wait for Enter between apps
 *   ONLY=next16 npm run test:framework:review      # one app (or comma list)
 *   PM=pnpm npm run test:framework:review          # install with another PM
 *   SKIP_BUILD=1 ...                               # reuse existing snapshots
 *
 * Evidence lands in tests/framework/review-report/.
 */
import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import {
  APPS,
  ensureTarball,
  here,
  installPm,
  installTarball,
  loadEnvKey,
  fixTarballDep,
  serveApp,
  snapshotCell,
} from './lib.mjs'
import { headedContext, headedLaunch, hudHoldScript, mountHudScript } from '../shared/review-banner.mjs'

const args = process.argv.slice(2)
const getArg = (k, d) => {
  const p = args.find((a) => a.startsWith(`--${k}=`))
  return p ? p.slice(k.length + 3) : d
}
const only = (getArg('only') || process.env.ONLY || 'vite5,vite6,vite7,next15,next16,cra').split(',')
const pm = getArg('pm', process.env.PM || 'npm')
const DWELL = Number(process.env.DWELL ?? 10_000)
const PAUSE = process.env.PAUSE === '1'
const SKIP_BUILD = process.env.SKIP_BUILD === '1'
const apiKey = loadEnvKey()

const reportDir = path.join(here, 'review-report')
fs.mkdirSync(reportDir, { recursive: true })

const waitForEnter = (label) => {
  if (!PAUSE) return Promise.resolve()
  return new Promise((resolve) => {
    process.stdout.write(`  ⏸  press ENTER to continue to ${label} … `)
    const onData = (d) => {
      if (d.toString().includes('\n')) {
        process.stdin.removeListener('data', onData)
        process.stdin.setRawMode?.(false)
        resolve()
      }
    }
    process.stdin.setRawMode?.(true)
    process.stdin.resume()
    process.stdin.on('data', onData)
  })
}

console.log('[review] building library + packing tarball...')
const tarball = ensureTarball()
const tarballName = path.basename(tarball)

// ---------- plan cells ----------
const cells = []
for (const key of only) {
  const app = APPS[key]
  if (!app) { console.error(`[review] unknown app "${key}"`); process.exit(2) }
  for (const cell of app.buildCells) {
    cells.push({ key, app, cell, cwd: path.join(here, app.dir), slug: cell.name.replace(/[^a-z0-9]+/gi, '-') })
  }
}
const total = cells.length

// ---------- phase 1: prepare (install + build + snapshot everything) ----------
if (!SKIP_BUILD) {
  const seenApps = new Set()
  for (const { key, app, cwd } of cells) {
    if (!seenApps.has(key)) {
      seenApps.add(key)
      fixTarballDep(cwd, tarballName)
      // Content-aware skip: reinstall ONLY when the fresh tarball differs
      // from what the app has extracted (version alone can't tell — 3.0.0 is
      // unreleased, so rebuilds keep the same version with new bytes).
      const tarballSha = createHash('sha256').update(fs.readFileSync(tarball)).digest('hex')
      const shaFile = path.join(cwd, 'node_modules', 'react-bkoi-gl', '.fw-sha')
      const installedSha = fs.existsSync(shaFile) ? fs.readFileSync(shaFile, 'utf8').trim() : null
      const pkgDir = path.join(cwd, 'node_modules', 'react-bkoi-gl')
      if (fs.existsSync(pkgDir) && installedSha === tarballSha) {
        console.log(`\n[prepare] ${key}: tarball unchanged (sha match) — skipping install`)
      } else {
        const why = installedSha ? 'tarball content changed' : 'not installed'
        console.log(`\n[prepare] ${key}: installing tarball (${why})...`)
        if (!fs.existsSync(pkgDir)) installPm(cwd, pm) // base deps only on first setup
        installTarball(cwd, tarball, pm)
        fs.writeFileSync(shaFile, tarballSha)
      }
      if (app.jest) {
        console.log(`[prepare] ${key}: jest...`)
        try {
          const env = { ...process.env, DISABLE_ESLINT_PLUGIN: 'true' }
          execSync(app.jest.cmd, { cwd, stdio: 'inherit', timeout: app.jest.timeout, env })
        } catch (e) {
          console.error(`[prepare] ${key}: jest FAILED (continuing to visual review)`)
        }
      }
    }
  }
  for (const { key, app, cell, cwd, slug } of cells) {
    console.log(`[prepare] ${key}: ${cell.name}...`)
    const env = { ...process.env, [`${app.envPrefix}BARIKOI_API_KEY`]: apiKey }
    if (key === 'cra') env.DISABLE_ESLINT_PLUGIN = 'true'
    execSync(cell.cmd, { cwd, stdio: 'inherit', timeout: 420_000, env })
    snapshotCell(cwd, key, slug)
  }
} else {
  for (const { cwd, slug } of cells) {
    if (!fs.existsSync(path.join(cwd, '.fw-snap', slug))) {
      console.error(`[review] missing snapshot for ${slug} — run once without SKIP_BUILD`)
      process.exit(2)
    }
  }
}

// ---------- phase 2: headed walkthrough (instant transitions) ----------
const browser = await chromium.launch(headedLaunch)
const context = await browser.newContext(headedContext)
const page = await context.newPage()

const results = []
let n = 0

for (const { key, app, cell, cwd, slug } of cells) {
  n += 1
  console.log(`\n━━ ${key} — ${cell.name}`)
  const errors = []
  page.removeAllListeners('pageerror')
  page.on('pageerror', (e) => errors.push(String(e)))

  process.stdout.write(`  ▶ ${key} … `)
  let url
  let stop
  try {
    ;({ url, stop } = await serveApp(cwd, app, slug))
  } catch {
    results.push({ app: key, cell: cell.name, pm, ok: false, errors: ['server did not start'] })
    console.log('FAIL (server did not start)')
    continue
  }

  await page.goto(url, { waitUntil: 'domcontentloaded' })
  let ready = false
  try {
    await page.waitForFunction(() => window.__IDLE === true || window.__READY === true, null, { timeout: 45_000 })
    ready = true
  } catch {
    errors.push('map did not render within 45s')
  }

  // Bottom-center HUD pill — same visual as the e2e fixtures' review hold:
  // pulsing dot + "Rendering · <app>" + a DWELL (10s) draining progress bar.
  await page.evaluate(mountHudScript({ label: `${key} · ${cell.name}` }))
  await page.evaluate((t) => { document.title = t }, `▶ ${key} · ${cell.name} (${n}/${total})`)

  const shot = path.join(reportDir, `${key}-${slug}.png`)
  await page.screenshot({ path: shot })

  if (ready && DWELL > 0) {
    await page.evaluate(hudHoldScript(DWELL)).catch(() => {})
  } else if (!ready) {
    await page.evaluate(mountHudScript({ label: `${key} · ${cell.name} — DID NOT RENDER` })).catch(() => {})
    await page.waitForTimeout(2000)
  }
  await waitForEnter(`${key} next cell`)

  const ok = ready && errors.length === 0
  results.push({ app: key, cell: cell.name, pm, ok, url, screenshot: path.relative(here, shot), errors })
  console.log(ok ? 'OK' : `FAIL (${errors.join('; ')})`)
  await stop()
}

await browser.close()

console.log('\n===== REVIEW SUMMARY =====')
for (const r of results) {
  console.log(`${r.ok ? '✓' : '✗'} ${r.app} — ${r.cell} (pm=${r.pm})${r.errors.length ? ` — ${r.errors.join('; ')}` : ''}`)
}
fs.writeFileSync(path.join(reportDir, 'summary.json'), JSON.stringify(results, null, 2))
console.log(`\n[review] evidence in tests/framework/review-report/ — overall: ${results.every((r) => r.ok) ? 'PASS' : 'FAIL'}`)
process.exit(results.every((r) => r.ok) ? 0 : 1)
