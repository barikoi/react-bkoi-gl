/**
 * Headless verification that a built framework app actually renders a map.
 *
 * Proves, per app: a Worker is constructed (init-script shim), its URL loads
 * (200), the wrapper onLoad fires (window.__READY), the engine reaches `idle`
 * — tiles parsed by the worker and rendered (window.__IDLE) — and no uncaught
 * page errors occurred.
 *
 * Usage: node verify.mjs --name <label> --url <http://host:port> [--out results.json]
 * (For static build dirs pass --dir instead of --url; a static server is
 * started on --port.)
 */
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { serveStatic } from './lib.mjs'

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`)
  return i === -1 ? d : process.argv[i + 1]
}

const name = arg('name', 'app')
let url = arg('url')
const dir = arg('dir')
const port = Number(arg('port', 6180))
const outFile = arg('out')

let server
if (!url && dir) {
  server = await serveStatic(path.resolve(dir), port)
  url = `http://localhost:${port}/`
}
if (!url) { console.error('verify: need --url or --dir'); process.exit(2) }

const result = { name, url, ok: false, workers: [], workerStatus: null, ready: false, idle: false, errors: [], consoleErrors: [], httpFailures: [] }

const browser = await chromium.launch()
try {
  const context = await browser.newContext()
  await context.addInitScript(() => {
    window.__WORKERS = []
    const Orig = window.Worker
    window.Worker = function (url, ...rest) {
      window.__WORKERS.push(String(url))
      return new Orig(url, ...rest)
    }
  })
  const page = await context.newPage()
  page.on('pageerror', (e) => result.errors.push(String(e)))
  page.on('response', (r) => {
    if (r.status() >= 400) result.httpFailures.push(`${r.status()} ${r.url()}`)
  })
  // Console errors are recorded but do NOT fail the run: styles (including
  // Barikoi's) can emit engine validation warnings unrelated to the library
  // under test. Uncaught page exceptions below are the real failure signal.
  page.on('console', (m) => { if (m.type() === 'error') result.consoleErrors.push(m.text()) })

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 })

  // Wait for tiles to render (idle) — the signal that the worker pipeline works.
  await page.waitForFunction(
    () => window.__IDLE === true || window.__READY === true,
    { timeout: 60_000 }
  ).catch(() => {})
  // Give idle a grace period after load (real remote tiles take a few seconds).
  await page.waitForFunction(() => window.__IDLE === true, { timeout: 30_000 }).catch(() => {})

  result.ready = await page.evaluate(() => window.__READY === true)
  result.idle = await page.evaluate(() => window.__IDLE === true)
  result.workers = await page.evaluate(() => window.__WORKERS || [])
  if (result.workers.length) {
    result.workerStatus = await page.evaluate(async (urls) => {
      const statuses = await Promise.all(urls.map(async (u) => {
        try { return (await fetch(u)).status } catch { return 0 }
      }))
      return statuses
    }, result.workers)
  }

  result.ok =
    result.workers.length > 0 &&
    result.workerStatus.every((s) => s === 200) &&
    result.ready &&
    result.idle &&
    result.errors.length === 0
} catch (e) {
  result.errors.push(String(e))
} finally {
  await browser.close()
  if (server) server.close()
}

console.log(JSON.stringify(result, null, 2))
if (outFile) fs.writeFileSync(outFile, JSON.stringify(result, null, 2))
process.exit(result.ok ? 0 : 1)
