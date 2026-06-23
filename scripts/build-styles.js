/* eslint-disable no-console */
/**
 * Build step: assemble the published stylesheet.
 *
 * Concatenates the vendor CSS (maplibre-gl + maplibre-gl-draw) with the
 * committed `styles/overrides.css`, then writes the module type declaration.
 *
 * Unlike the old modify-css.js, this performs NO runtime regex mutation of
 * the vendor CSS — overrides live in `styles/overrides.css` and win by
 * source order (equal specificity, later declaration wins).
 */
import { promises as fs } from 'fs'
import { resolve } from 'path'

const VENDOR_CSS = [
  resolve('node_modules/maplibre-gl/dist/maplibre-gl.css'),
  resolve('node_modules/maplibre-gl-draw/dist/mapbox-gl-draw.css'),
]
const OVERRIDES_CSS = resolve('styles/overrides.css')
const OUT_CSS = resolve('dist/styles/react-bkoi-gl.css')
const OUT_DTS = resolve('dist/styles/index.d.ts')

const TYPE_DEFINITION = `declare module 'react-bkoi-gl/styles' {
  const styles: string;
  export default styles;
}
`

async function readIfExists(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8')
  } catch {
    console.warn(`[build-styles] skipping missing CSS: ${filePath}`)
    return ''
  }
}

async function main() {
  await fs.mkdir(resolve('dist/styles'), { recursive: true })

  const parts = []
  for (const vendorPath of VENDOR_CSS) {
    const css = await readIfExists(vendorPath)
    if (css) parts.push(css.trimEnd())
  }

  const overrides = await readIfExists(OVERRIDES_CSS)
  if (overrides) {
    parts.push('/* react-bkoi-gl style overrides */\n' + overrides.trimEnd())
  }

  await fs.writeFile(OUT_CSS, parts.join('\n\n') + '\n', 'utf8')
  console.log(`[build-styles] wrote ${OUT_CSS}`)

  await fs.writeFile(OUT_DTS, TYPE_DEFINITION, 'utf8')
  console.log(`[build-styles] wrote ${OUT_DTS}`)
}

main().catch(error => {
  console.error('[build-styles] failed:', error)
  process.exitCode = 1
})
