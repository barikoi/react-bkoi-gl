// Runtime contract for README examples: every extractable, browser-runnable
// example from tmp/readme-examples/manifest.json (generated verbatim by
// scripts/check-readme-examples.mjs; `npm run e2e` chains the extraction)
// must mount, render a map canvas, and produce zero page errors.
//
// 'skip' entries (framework-specific examples, e.g. next/dynamic) and
// 'import-only' entries (fragments, style consts, type imports) are asserted
// known — not silently dropped.
import { readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'

const manifest = JSON.parse(readFileSync('tmp/readme-examples/manifest.json', 'utf8'))
const mountable = manifest.filter(e => e.mode === 'mount')
const skipped = manifest.filter(e => e.mode === 'skip')
const importOnly = manifest.filter(e => e.mode === 'import-only')

// Sanity: the manifest must actually contain runtime coverage — an empty or
// all-skipped manifest means the extraction pipeline broke, not that the
// examples are fine.
test('README example manifest has runtime coverage', () => {
  expect(mountable.length).toBeGreaterThanOrEqual(15)
  expect(skipped.length).toBe(1)
  for (const s of skipped) expect(s.reason).toBeTruthy()
})

for (const entry of mountable) {
  test(`README example ${entry.id} (${entry.components.join(', ')}) mounts`, async ({ page }) => {
    await page.goto(`/?case=readme-examples&example=${entry.id}`)
    await expect
      .poll(
        () => page.evaluate(() => window.__LOG__.filter(l => l.type === 'readme-example').length),
        {
          timeout: 30_000,
        }
      )
      .toBeGreaterThan(0)
    const log = await page.evaluate(() => window.__LOG__.find(l => l.type === 'readme-example'))
    expect(log.status, log.error ?? '').toBe('mounted')
    // The example actually rendered a WebGL map, not just a React tree.
    await expect.poll(() => page.locator('canvas').count(), { timeout: 20_000 }).toBeGreaterThan(0)
    expect(await page.evaluate(() => window.__pageErrors__)).toEqual([])
  })
}

// Import-only entries execute no component; they exist only so the typecheck
// half of the harness covers them. Keep this count pinned so a new README
// fragment is a conscious decision, not an accident.
test('README example manifest import-only count', () => {
  expect(importOnly.length).toBeGreaterThanOrEqual(4)
})
