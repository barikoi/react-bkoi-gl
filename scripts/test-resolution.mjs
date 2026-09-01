#!/usr/bin/env node
/**
 * Package-manager resolution test — proves the packed tarball INSTALLS and
 * RESOLVES under every supported package manager (npm, pnpm, yarn, bun),
 * WITHOUT building a framework app or rendering a map.
 *
 * Per PM, in an isolated temp sandbox:
 *   1. minimal package.json
 *   2. install react + react-dom (peers) and the packed tarball with that PM
 *   3. run a node smoke that imports 'react-bkoi-gl' BY NAME (exercises the
 *      exports map through the PM's node_modules layout — pnpm's symlink
 *      store, yarn's hoisting, bun's isolated layout) and resolves the
 *      './styles' and './worker' subpaths to real files
 *
 * This is the cheap companion to the framework suite: the framework suite
 * proves the apps render; this proves installability/resolution for PMs the
 * framework matrix does not cover by default.
 *
 * Usage: npm run test:resolution [-- --pm=npm,pnpm,yarn,bun] [--keep]
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(fileURLToPath(import.meta.url), '../..')
const args = process.argv.slice(2)
const getArg = (k, d) => {
  const a = args.find((x) => x.startsWith(`--${k}=`))
  return a ? a.split('=').slice(1).join('=') : d
}
const pms = getArg('pm', 'npm,pnpm,yarn,yarn-berry,bun').split(',')
const keep = args.includes('--keep')

const run = (cmd, cmdArgs, opts = {}) =>
  execFileSync(cmd, cmdArgs, { encoding: 'utf-8', ...opts })

const expectedVersion = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'))).version

// Install commands per PM: peers + the tarball in one transaction.
const installCmd = (pm, tarball) =>
  ({
    npm: `npm install --no-audit --no-fund "${tarball}" react@18.3.1 react-dom@18.3.1`,
    pnpm: `pnpm add "${tarball}" react@18.3.1 react-dom@18.3.1`,
    yarn: `yarn add "file:${tarball}" react@18.3.1 react-dom@18.3.1`,
    bun: `bun add "${tarball}" react@18.3.1 react-dom@18.3.1`,
  })[pm]

// Runs INSIDE the sandbox. Import by name (exports map via the PM's layout),
// resolve subpaths via createRequire (css/mjs are not node-importable).
const SMOKE = `import { createRequire } from 'node:module'
import * as lib from 'react-bkoi-gl'

const required = ['Map', 'Marker', 'Popup', 'Source', 'Layer', 'useMap', 'DrawControl',
  'setWorkerUrl', 'getWorkerUrl', 'getVersion', 'GPUInitializationError']
const missing = required.filter((k) => !(k in lib))
if (missing.length) { console.error('missing exports: ' + missing.join(', ')); process.exit(1) }
if (lib.default !== lib.Map) { console.error('default export is not Map'); process.exit(1) }

const require = createRequire(import.meta.url)
for (const sub of ['react-bkoi-gl/styles', 'react-bkoi-gl/worker']) {
  const file = require.resolve(sub)
  if (!require('node:fs').statSync(file).size) { console.error('empty subpath: ' + sub); process.exit(1) }
  console.log(sub, '->', file)
}
console.log('exports + subpaths OK')
`

// Yarn Berry (v4, default PnP linker) — no node_modules at all; resolution
// goes through the .pnp.cjs virtual store, the strictest layout we claim.
// NOTE: Node's own ESM resolver under PnP is broken on current Node for EVERY
// package (import('react') fails the same way — experimental loader), and real
// bundlers resolve PnP via .pnp.cjs, not Node ESM. So this cell asserts the
// meaningful contract: tarball installs, and CJS require.resolve finds '.',
// './styles', './worker' through the PnP virtual store + peers load.
function setupYarnBerry(sandbox) {
  fs.writeFileSync(
    path.join(sandbox, '.yarnrc.yml'),
    'nodeLinker: pnp\nenableGlobalCache: true\n'
  )
  // Global yarn may be v1 (or corepack shims not enabled) — pin the project
  // to Yarn 4 and address it VIA COREPACK, which reads the packageManager
  // field corepack use just wrote (no .yarn/releases path assumptions).
  run('corepack', ['use', 'yarn@4'], { cwd: sandbox, stdio: 'inherit' })
  return 'COREPACK_ENABLE_STRICT=0 corepack yarn'
}

function pnpSmoke(sandbox) {
  // PnP registers the workspace under its REAL path; on macOS os.tmpdir()
  // (/var/folders) is a symlink to /private/var/folders, and an issuer built
  // from the symlinked path misses the PnP location map (every resolve fails).
  const realSandbox = fs.realpathSync(sandbox)
  return `const assert = (ok, what) => { if (!ok) { console.error('FAIL ' + what); process.exit(1) } }
const { createRequire } = require('node:module')
const req = createRequire('${realSandbox}/package.json')
const main = req.resolve('react-bkoi-gl')
const styles = req.resolve('react-bkoi-gl/styles')
const worker = req.resolve('react-bkoi-gl/worker')
assert(main.endsWith('dist/index.js') || main.endsWith('dist/index.cjs'), 'main resolves: ' + main)
assert(styles.endsWith('react-bkoi-gl.css'), 'styles resolves: ' + styles)
assert(worker.endsWith('bkoi-map-worker.mjs'), 'worker resolves: ' + worker)
req('react'); req('react-dom') // peers load through PnP
const fs = require('node:fs')
const pkgDir = main.slice(0, main.lastIndexOf('/dist/'))
const pkg = JSON.parse(fs.readFileSync(pkgDir + '/package.json', 'utf8'))
assert(pkg.name === 'react-bkoi-gl', 'package name via PnP store')
assert(pkg.version === '${expectedVersion}', 'version via PnP store: ' + pkg.version)
console.log('main  ->', main)
console.log('styles ->', styles)
console.log('worker ->', worker)
console.log('PnP resolution OK')`
}

console.log('[test:resolution] building dist + packing tarball...')
run('npm', ['run', 'build'], { cwd: repoRoot, stdio: 'inherit' })
const tarballName = JSON.parse(run('npm', ['pack', '--json'], { cwd: repoRoot }))[0].filename
const tarball = path.join(repoRoot, tarballName)

const sandboxes = []
let failed = 0
for (const pm of pms) {
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), `bkoi-res-${pm}-`))
  sandboxes.push(sandbox)
  fs.writeFileSync(
    path.join(sandbox, 'package.json'),
    JSON.stringify({ name: `bkoi-res-${pm}`, private: true, type: 'module' }, null, 2) + '\n'
  )
  try {
    let install = installCmd(pm === 'yarn-berry' ? 'yarn' : pm, tarball)
    if (pm === 'yarn-berry') {
      console.log(`\n[test:resolution] ${pm}: setting up Yarn Berry (PnP linker)...`)
      install = `${setupYarnBerry(sandbox)} add react-bkoi-gl@"file:${tarball}" react@18.3.1 react-dom@18.3.1`
    }
    console.log(`[test:resolution] ${pm}: installing tarball + peers...`)
    run('bash', ['-c', install], { cwd: sandbox, stdio: 'inherit', timeout: 300_000 })

    const isPnp = pm === 'yarn-berry'
    if (isPnp) {
      fs.writeFileSync(path.join(sandbox, 'smoke.cjs'), pnpSmoke(sandbox))
      const out = run('node', ['--require', path.join(sandbox, '.pnp.cjs'), 'smoke.cjs'], { cwd: sandbox })
      console.log(out.trim())
    } else {
      fs.writeFileSync(path.join(sandbox, 'smoke.mjs'), SMOKE)
      console.log(`[test:resolution] ${pm}: resolving...`)
      console.log(run('node', ['smoke.mjs'], { cwd: sandbox }).trim())
      const installed = JSON.parse(
        fs.readFileSync(path.join(sandbox, 'node_modules', 'react-bkoi-gl', 'package.json'), 'utf8')
      ).version
      if (installed !== expectedVersion) throw new Error(`installed ${installed}, expected ${expectedVersion}`)
    }
    console.log(`PASS ${pm} — install + exports map + subpaths + version`)
  } catch (e) {
    failed++
    console.error(`FAIL ${pm}: ${String(e.message || e).split('\n')[0]}`)
  }
}

if (!keep) {
  for (const s of sandboxes) fs.rmSync(s, { recursive: true, force: true })
  fs.rmSync(tarball, { force: true })
} else {
  console.log('sandboxes kept:', sandboxes.join(' '), 'tarball:', tarball)
}

if (failed) {
  console.error(`\n[test:resolution] ${failed}/${pms.length} package manager(s) FAILED`)
  process.exit(1)
}
console.log(`\n[test:resolution] all ${pms.length} package manager(s) PASS`)
