#!/usr/bin/env node
/**
 * Framework compatibility runner — see tests/framework/README.md.
 *
 * Usage:
 *   node tests/framework/run.mjs [--only=vite,next15,next16,cra] [--pm=npm|pnpm|yarn|bun]
 *   npm run test:framework
 *
 * Per app: install base deps with the chosen PM, install the packed tarball,
 * build (each bundler mode), serve, headlessly verify map rendering.
 * Long installs are expected; run this script detached and poll its log.
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { APPS, ensureTarball, fixTarballDep, here, installPm, installTarball, loadEnvKey, serveApp, sh } from './lib.mjs'

// ---------- args ----------
const args = process.argv.slice(2)
const getArg = (k, d) => {
  const p = args.find((a) => a.startsWith(`--${k}=`))
  return p ? p.slice(k.length + 3) : d
}
const only = getArg('only', 'vite,next15,next16,cra').split(',')
const pm = getArg('pm', 'npm')
const apiKey = loadEnvKey()

// ---------- build lib + pack ----------
console.log(`[run] building library + packing tarball (pm=${pm})...`)
const tarball = ensureTarball()
const tarballName = path.basename(tarball)

// ---------- run matrix ----------
const results = []
for (const key of only) {
  const app = APPS[key]
  if (!app) { console.error(`[run] unknown app "${key}" (known: ${Object.keys(APPS).join(',')})`); process.exit(2) }
  const cwd = path.join(here, app.dir)
  const res = { app: key, pm, label: app.label, cells: [], jest: null, ok: false }
  console.log(`\n=== ${key} (${app.label}) pm=${pm} ===`)

  fixTarballDep(cwd, tarballName)
  console.log(`[${key}] install base deps + tarball...`)
  installPm(cwd, pm)
  installTarball(cwd, tarball, pm)

  if (app.jest) {
    console.log(`[${key}] jest...`)
    try {
      const env = { ...process.env, DISABLE_ESLINT_PLUGIN: 'true' }
      execSync(app.jest.cmd, { cwd, stdio: 'inherit', timeout: app.jest.timeout, env })
      res.jest = 'pass'
    } catch {
      res.jest = 'fail'
    }
  }

  let overall = true
  for (const cell of app.buildCells) {
    console.log(`[${key}] ${cell.name}...`)
    let status = 'pass'
    let note = ''
    try {
      const env = { ...process.env, [`${app.envPrefix}BARIKOI_API_KEY`]: apiKey }
      if (key === 'cra') env.DISABLE_ESLINT_PLUGIN = 'true' // parent node_modules conflict (nested-app artifact, not a library issue)
      execSync(cell.cmd, { cwd, stdio: 'inherit', timeout: 420_000, env })
    } catch (e) {
      const errText = String(e)
      if (/unknown option/i.test(errText)) {
        status = 'skipped'; note = 'flag unsupported in this version'
      } else {
        status = 'fail'
      }
    }
    if (status === 'pass') {
      let stop = null
      let url = null
      try {
        ;({ url, stop } = await serveApp(cwd, app))
      } catch {
        status = 'fail'; note = 'server did not start'
      }
      if (url) {
        const out = path.join(here, `result-${key}.json`)
        try {
          sh(`node ${['verify.mjs', '--name', `${key}/${cell.name} pm=${pm}`, '--url', url, '--out', out].map((a) => `"${a}"`).join(' ')}`, here, 240_000)
        } catch {
          status = 'fail'; note = 'verification failed'
        }
      }
      if (stop) await stop()
    }
    res.cells.push({ cell: cell.name, status, note })
    if (status === 'fail') overall = false
  }

  if (res.jest === 'fail') overall = false
  res.ok = overall
  results.push(res)
}

// ---------- summary ----------
console.log('\n===== SUMMARY =====')
let allOk = true
for (const r of results) {
  const cells = r.cells.map((c) => `${c.cell}:${c.status}${c.note ? ` (${c.note})` : ''}`).join(', ')
  const jest = r.jest ? ` jest:${r.jest}` : ''
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.app} (pm=${r.pm})${jest} — ${cells}`)
  if (!r.ok) allOk = false
}
fs.writeFileSync(path.join(here, 'results.json'), JSON.stringify(results, null, 2))
console.log(`\n[run] results written to tests/framework/results.json — overall: ${allOk ? 'PASS' : 'FAIL'}`)
process.exit(allOk ? 0 : 1)
