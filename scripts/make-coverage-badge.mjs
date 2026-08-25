#!/usr/bin/env node
/**
 * Generates a shields.io JSON endpoint file (coverage.json) from
 * Vitest's coverage/coverage-summary.json (v8 provider, json-summary reporter).
 *
 * Used locally and in CI: the file is committed to the default branch
 * and the README badge reads it via
 * https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/.../coverage.json
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

const color = pct >= 90 ? 'brightgreen' : pct >= 75 ? 'yellowgreen' : pct >= 60 ? 'yellow' : 'red';

const badge = {
  schemaVersion: 1,
  label: 'coverage',
  message: `${pct.toFixed(2)}%`,
  color,
};

const outPath = path.join(root, 'coverage.json');
writeFileSync(outPath, `${JSON.stringify(badge, null, 2)}\n`);
console.log(`[make-coverage-badge] wrote ${outPath} (${badge.message}, ${color})`);
