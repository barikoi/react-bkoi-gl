/** Shared helpers for the framework test runner + headed review. */
import { execSync, spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const here = path.dirname(fileURLToPath(import.meta.url))
export const repoRoot = path.resolve(here, '../..')

export const sh = (cmd, cwd, timeoutMs = 600_000, env = process.env) =>
  execSync(cmd, { cwd, stdio: 'inherit', timeout: timeoutMs, env })

export function loadEnvKey() {
  const envFile = path.join(repoRoot, '.env')
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  const key = process.env.BARIKOI_API_KEY || process.env.API_KEY
  if (!key) {
    console.error('[fw] missing BARIKOI_API_KEY (or API_KEY) in repo .env')
    process.exit(2)
  }
  return key
}

export function ensureTarball() {
  sh('npm run build', repoRoot, 300_000)
  const version = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'))).version
  const tarballName = `react-bkoi-gl-${version}.tgz`
  sh(`npm pack --pack-destination "${here}"`, repoRoot, 120_000)
  const tarball = path.join(here, tarballName)
  if (!fs.existsSync(tarball)) throw new Error(`tarball missing: ${tarball}`)
  return tarball
}

/** Normalize stale ABSOLUTE file: refs to the tarball (folder moves break them). */
export function fixTarballDep(cwd, tarballName) {
  const pkgPath = path.join(cwd, 'package.json')
  if (!fs.existsSync(pkgPath)) return
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  let changed = false
  for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const deps = pkg[section]
    if (!deps) continue
    for (const [name, spec] of Object.entries(deps)) {
      if (name === 'react-bkoi-gl' && typeof spec === 'string' && spec.startsWith('file:') && !spec.endsWith(tarballName)) {
        deps[name] = `file:../${tarballName}`
        changed = true
      }
    }
  }
  if (changed) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
    console.log(`[fw] normalized stale tarball dep in ${path.basename(cwd)}`)
  }
}

export function installPm(cwd, pm) {
  // npm's lockfile stores the tarball dep's RESOLVED ABSOLUTE path — a repo/
  // folder move invalidates it (ENOENT on install). Drop it and resolve fresh
  // from package.json's relative file: ref. pnpm/yarn/bun locks are relative.
  if (pm === 'npm') fs.rmSync(path.join(cwd, 'package-lock.json'), { force: true })
  const base = {
    npm: 'npm install --no-audit --no-fund',
    pnpm: 'pnpm install',
    yarn: 'yarn install',
    bun: 'bun install',
  }[pm]
  sh(base, cwd)
}

export function installTarball(cwd, tarball, pm) {
  const cmd = {
    npm: `npm install --no-audit --no-fund "${tarball}"`,
    pnpm: `pnpm add "${tarball}"`,
    yarn: `yarn add "file:${tarball}"`,
    bun: `bun add "${tarball}"`,
  }[pm]
  try {
    sh(cmd, cwd)
  } catch {
    // Foreign or broken node_modules (app last installed with another package
    // manager — npm cannot minimally refresh a pnpm/yarn tree). Reset once to
    // a clean tree; later runs skip via the sha check.
    console.log('[fw] minimal install failed — resetting node_modules for a clean install...')
    fs.rmSync(path.join(cwd, 'node_modules'), { recursive: true, force: true })
    fs.rmSync(path.join(cwd, 'package-lock.json'), { force: true })
    installPm(cwd, pm)
    sh(cmd, cwd)
  }
}

/** Skip reinstall when the app already has this tarball version installed. */
export function tarballInstalled(cwd, tarballName) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'node_modules', 'react-bkoi-gl', 'package.json'), 'utf8'))
    return pkg.name === 'react-bkoi-gl' && tarballName.includes(`-${pkg.version}.tgz`)
  } catch {
    return false
  }
}

export function killPortUsers(port) {
  try { execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore', timeout: 10_000 }) } catch { /* nothing on port */ }
  return new Promise((resolve) => {
    const t0 = Date.now()
    const tick = () => {
      let free = false
      try { execSync(`fuser ${port}/tcp`, { stdio: 'ignore', timeout: 10_000 }) } catch { free = true }
      if (free || Date.now() - t0 > 10_000) resolve()
      else setTimeout(tick, 300)
    }
    tick()
  })
}

export async function waitUp(url, timeoutMs = 45_000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.status < 500) return true
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

export const APPS = {
  vite6: {
    dir: 'vite6-app',
    label: 'Vite 6 (build + static serve)',
    envPrefix: 'VITE_',
    buildCells: [{ name: 'vite build', cmd: 'npx vite build' }],
    serve: { type: 'static', dir: 'dist' },
  },
  vite: {
    dir: 'vite-app',
    label: 'Vite 7 (build + static serve)',
    envPrefix: 'VITE_',
    buildCells: [{ name: 'vite build', cmd: 'npx vite build' }],
    serve: { type: 'static', dir: 'dist' },
  },
  next15: {
    dir: 'next15-app',
    label: 'Next.js 15 (App Router)',
    envPrefix: 'NEXT_PUBLIC_',
    buildCells: [
      { name: 'next build (webpack default)', cmd: 'npx next build' },
      { name: 'next build --turbopack', cmd: 'npx next build --turbopack' },
    ],
    serve: { type: 'next', port: 6102 },
  },
  next16: {
    dir: 'next16-app',
    label: 'Next.js 16 (App Router)',
    envPrefix: 'NEXT_PUBLIC_',
    buildCells: [
      { name: 'next build (turbopack default)', cmd: 'npx next build' },
      { name: 'next build --webpack', cmd: 'npx next build --webpack' },
    ],
    serve: { type: 'next', port: 6103 },
  },
  cra: {
    dir: 'cra-app',
    label: 'CRA react-scripts 5 (webpack 5) + Jest',
    envPrefix: 'REACT_APP_',
    buildCells: [{ name: 'react-scripts build', cmd: 'npx react-scripts build' }],
    serve: { type: 'static', dir: 'build' },
    jest: { cmd: 'CI=true npx react-scripts test --watchAll=false', timeout: 240_000 },
  },
}

export const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.map': 'application/json',
}

export function serveStatic(root, port) {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    let file = path.join(root, urlPath === '/' ? 'index.html' : urlPath)
    if (!file.startsWith(root)) { res.writeHead(403); return res.end() }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(root, 'index.html') // SPA fallback
    }
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end('not found') }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' })
    fs.createReadStream(file).pipe(res)
  })
  return new Promise((resolve) => server.listen(port, () => resolve(server)))
}

/** Start an app's production server; returns { url, stop }.
 *  With `slug`, serves/restores the PREBUILT snapshot from snapshotCell() so
 *  walkthrough transitions are instant (no build between cells). */
export async function serveApp(cwd, app, slug) {
  if (app.serve.type === 'next') {
    const port = app.serve.port
    await killPortUsers(port)
    if (slug) {
      // Swap the prebuilt snapshot into place — same-fs renames are instant.
      const snap = cellSnapPath(cwd, slug)
      execSync(`rm -rf ${path.join(cwd, '.next')} && mv ${snap} ${path.join(cwd, '.next')}`)
    }
    const bin = path.join(cwd, 'node_modules', '.bin', 'next')
    const child = spawn(bin, ['start', '-p', String(port)], { cwd, stdio: 'ignore', detached: true })
    const url = `http://localhost:${port}/`
    const up = await waitUp(url)
    if (!up) throw new Error('server did not start')
    return {
      url,
      stop: async () => {
        try { process.kill(-child.pid, 'SIGTERM') } catch { child.kill('SIGTERM') }
        await new Promise((r) => { child.on('exit', r); setTimeout(r, 3000) })
        await killPortUsers(port)
        if (slug) {
          // Park the built .next back into the snapshot for any later pass.
          try { execSync(`mv ${path.join(cwd, '.next')} ${cellSnapPath(cwd, slug)}`) } catch { /* already parked */ }
        }
      },
    }
  }
  const port = 6180
  await killPortUsers(port)
  const dir = slug ? cellSnapPath(cwd, slug) : path.join(cwd, app.serve.dir)
  const server = await serveStatic(dir, port)
  return {
    url: `http://localhost:${port}/`,
    stop: async () => new Promise((r) => server.close(r)),
  }
}

const CELL_OUT = { vite: 'dist', cra: 'build', next15: '.next', next16: '.next' }

export function cellSnapPath(cwd, slug) {
  return path.join(cwd, '.fw-snap', slug)
}

/** Rename the fresh build output into the snapshot slot (instant, no copy). */
export function snapshotCell(cwd, appKey, slug) {
  const out = path.join(cwd, CELL_OUT[appKey])
  const snap = cellSnapPath(cwd, slug)
  fs.rmSync(snap, { recursive: true, force: true })
  fs.mkdirSync(path.dirname(snap), { recursive: true })
  fs.renameSync(out, snap)
}
