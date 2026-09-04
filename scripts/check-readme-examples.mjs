// One-off harness: extracts every fenced README example and typechecks it
// against the live source (src/index.ts), the way a consumer's tsc would.
//   node tmp/check-readme-examples.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'

const md = readFileSync('README.md', 'utf8')
const blocks = [...md.matchAll(/```(\w*)\n([\s\S]*?)```/g)]

const dir = 'tmp/readme-examples'
rmSync(dir, { recursive: true, force: true })
mkdirSync(dir, { recursive: true })

let n = 0
const files = []
const runtime = [] // manifest for the readme-examples e2e case
// Blocks that cannot run in a plain browser page (framework-specific imports).
const RUNTIME_SKIP = new Map([[6, 'Next.js-specific (next/dynamic + relative app import)']])
blocks.forEach(([, lang, code], i) => {
  // Skip non-app blocks: shell install commands, the CRA jest.mock config,
  // and the bare styles import (validated by the shim + e2e styles case).
  if (['bash', 'js', 'javascript'].includes(lang)) return
  const isTsx = lang === 'tsx'
  const ext = isTsx ? 'tsx' : 'ts'
  const name = `Example${String(i).padStart(2, '0')}.${ext}`
  let out = code

  // Fragment scaffolding — README text stays byte-identical; only surrounding
  // declarations are added so fragments compile in the same file.
  if (i === 26) {
    out =
      "import { useRef } from 'react';\nimport type { MapRef } from 'react-bkoi-gl';\n" +
      'declare const lng: number, lat: number, zoom: number, bearing: number, pitch: number;\n' +
      'declare const options: any;\n' +
      'export function demo() {\n' +
      'if (true) {\n' +
      code +
      '\n}\n}\n'
  } else if (i === 29) {
    // Pick-one list: assert each line separately.
    const lines = code.trim().split('\n').filter(Boolean)
    lines.forEach((line, j) => {
      const one = `declare const BARIKOI_API_KEY: string;\n${line}\nexport const style${j} = mapStyle;\n`
      writeFileSync(`${dir}/Example${String(i).padStart(2, '0')}_${j}.ts`, one)
      files.push(`Example${String(i).padStart(2, '0')}_${j}.ts`)
    })
    return
  }

  // Runtime manifest entry + named-export footer for the e2e case: find the
  // component functions the example defines so the case page can mount them
  // verbatim. Fragment blocks (26) and style consts (29) contribute no mounts.
  const scaffolded = i === 26
  const components = scaffolded ? [] : [...code.matchAll(/^function ([A-Z]\w+)\(/gm)].map(m => m[1])
  const hasDefault = /^export default /m.test(code)
  if (components.length && !hasDefault) out += `\nexport { ${components.join(', ')} };\n`
  runtime.push({
    id: `Example${String(i).padStart(2, '0')}`,
    mode: RUNTIME_SKIP.has(i) ? 'skip' : components.length || hasDefault ? 'mount' : 'import-only',
    reason: RUNTIME_SKIP.get(i) ?? null,
    components,
  })

  writeFileSync(`${dir}/${name}`, out)
  files.push(name)
  n++
})

// Runtime manifest for tests/e2e/specs/readme-examples.spec.ts + the case page.
writeFileSync(`${dir}/manifest.json`, JSON.stringify(runtime, null, 2))

writeFileSync(
  `${dir}/tsconfig.json`,
  JSON.stringify(
    {
      extends: '../../tsconfig.json',
      compilerOptions: {
        jsx: 'react-jsx',
        strict: true,
        rootDir: '../..',
        types: ['geojson'],
        paths: { 'react-bkoi-gl': ['../../dist/index.d.ts'] },
      },
      include: ['**/*.ts', '**/*.tsx'],
    },
    null,
    2
  )
)

writeFileSync(
  `${dir}/shims.d.ts`,
  `declare module 'react-bkoi-gl/styles';
declare module 'next/dynamic';
declare const BARIKOI_API_KEY: string;
declare const Sentry: { captureMessage: (m: string) => void; captureException: (e: unknown) => void };
declare const process: { env: Record<string, string | undefined> };
`
)

// Example 6 imports '../components/MapView' — the file Example 5 defines.
mkdirSync('tmp/components', { recursive: true })
const mapview = blocks[5][2]
writeFileSync('tmp/components/MapView.tsx', mapview)

console.log(`wrote ${files.length} example files`)
