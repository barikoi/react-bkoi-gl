#!/usr/bin/env node
/**
 * Pack smoke test — proves the BUILT artifact (not src/) installs and loads.
 *
 * 1. build + `npm pack` the tarball
 * 2. extract it into a temp sandbox
 * 3. symlink `react-bkoi-gl` -> extracted package, and react/react-dom from
 *    this repo's node_modules (offline; they are the only bundle externals)
 * 4. run smoke.mjs inside the sandbox: import 'react-bkoi-gl' BY NAME so
 *    package.json `exports` resolution is exercised, assert the public
 *    surface (ESM + CJS entries), shipped files, and version
 *
 * Usage: npm run test:pack
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(fileURLToPath(import.meta.url), '../..')
const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { cwd: repoRoot, encoding: 'utf8', ...opts })

const expectedVersion = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'))).version

let sandbox
let tarballPath
try {
  console.log('[test:pack] building dist...')
  run('npm', ['run', 'build'], { stdio: 'inherit' })

  console.log('[test:pack] npm pack...')
  const tarballName = JSON.parse(run('npm', ['pack', '--json']))[0].filename
  tarballPath = path.join(repoRoot, tarballName)
  console.log(`[test:pack] tarball: ${tarballName}`)

  sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'bkoi-pack-'))
  run('tar', ['-xzf', tarballPath, '-C', sandbox])

  // By-name resolution sandbox (offline)
  const nm = path.join(sandbox, 'node_modules')
  fs.mkdirSync(nm, { recursive: true })
  fs.symlinkSync(path.join(sandbox, 'package'), path.join(nm, 'react-bkoi-gl'))
  for (const dep of ['react', 'react-dom', 'maplibre-gl']) {
    fs.symlinkSync(path.join(repoRoot, 'node_modules', dep), path.join(nm, dep))
  }

  fs.writeFileSync(
    path.join(sandbox, 'smoke.mjs'),
    `import fs from 'node:fs'
import * as lib from 'react-bkoi-gl'

const required = [
  'Map', 'Marker', 'Popup', 'AttributionControl', 'FullscreenControl',
  'GeolocateControl', 'NavigationControl', 'ScaleControl', 'TerrainControl',
  'LogoControl', 'Source', 'CanvasSource', 'Layer', 'useControl',
  'MapProvider', 'useMap', 'DrawControl', 'GlobeControl', 'logger', 'setLogger',
]
const missing = required.filter((k) => !(k in lib))
if (missing.length) {
  console.error('missing exports: ' + missing.join(', '))
  process.exit(1)
}
if (lib.default !== lib.Map) {
  console.error('default export is not Map')
  process.exit(1)
}
if (typeof lib.DrawControl !== 'function' && !lib.DrawControl?.$$typeof) {
  console.error('DrawControl is not a component (expected function or memo object)')
  process.exit(1)
}

// CJS entry cannot be require()d on Node: maplibre-gl v6 is ESM-only
// (no "require" condition in its exports map), so dist/index.cjs is
// bundler-only. Asserted via file presence in the shipped-files check below.

// Shipped artifacts + version parity with the repo
for (const file of [
  'package/dist/index.js',
  'package/dist/index.cjs',
  'package/dist/index.d.ts',
  'package/dist/styles/react-bkoi-gl.css',
]) {
  if (!fs.existsSync(new URL(file, import.meta.url))) {
    console.error('missing shipped file: ' + file)
    process.exit(1)
  }
}
const pkg = JSON.parse(fs.readFileSync(new URL('package/package.json', import.meta.url)))
if (pkg.version !== process.env.EXPECTED_VERSION) {
  console.error(\`version mismatch: tarball \${pkg.version} != repo \${process.env.EXPECTED_VERSION}\`)
  process.exit(1)
}
console.log('test:pack smoke OK')
`
  )

  execFileSync('node', ['smoke.mjs'], {
    cwd: sandbox,
    stdio: 'inherit',
    env: { ...process.env, EXPECTED_VERSION: expectedVersion },
  })
} finally {
  if (tarballPath && fs.existsSync(tarballPath)) fs.unlinkSync(tarballPath)
  if (sandbox) fs.rmSync(sandbox, { recursive: true, force: true })
}
