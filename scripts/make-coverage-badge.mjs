#!/usr/bin/env node
/**
 * Generates a shields.io JSON endpoint file (coverage.json) from
 * Vitest's coverage/coverage-summary.json (v8 provider, json-summary reporter).
 *
 * Color thresholds match the barikoiapis-golang CI so coverage colors are
 * consistent across Barikoi repos. CI publishes the file to the orphan
 * `badges` branch (force-pushed); locally it is written to the repo root for
 * preview and is gitignored.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const summaryPath = path.join(root, 'coverage', 'coverage-summary.json');

let summary;
try {
  summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
} catch {
  console.error(`[make-coverage-badge] cannot read ${summaryPath} — run vitest --coverage first`);
  process.exit(1);
}

const pct = summary.total && summary.total.lines ? summary.total.lines.pct : 0;

// Same bands as barikoiapis-golang's CI (go tool cover)
const pctInt = Math.floor(pct);
const color =
  pctInt >= 90
    ? 'brightgreen'
    : pctInt >= 80
      ? 'green'
      : pctInt >= 70
        ? 'yellow'
        : pctInt >= 60
          ? 'orange'
          : 'red';

const badge = {
  schemaVersion: 1,
  label: 'coverage',
  message: `${pct.toFixed(2)}%`,
  color,
};

const outPath = path.join(root, 'coverage.json');
writeFileSync(outPath, `${JSON.stringify(badge, null, 2)}\n`);
console.log(`[make-coverage-badge] wrote ${outPath} (${badge.message}, ${color})`);
