#!/usr/bin/env node
/**
 * Generates the README's zero-dependency badges — self-contained shields-style
 * SVGs committed to the repo and referenced by relative path, so they render
 * on a PRIVATE repo (github.com, signed-in) with no external service, no CI,
 * and no repo-visibility dependency.
 *
 * Inputs (each optional — a badge is generated for every input present):
 *   - coverage/coverage-summary.json  (vitest json-summary reporter)  → coverage-badge.svg
 *   - test-results.json               (vitest json reporter)           → tests-badge.svg
 *
 * Wired into `npm test` and `npm run coverage`, which regenerate them locally.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const readJson = file => {
  try {
    return JSON.parse(readFileSync(path.join(root, file), 'utf8'));
  } catch {
    return null;
  }
};

// --- shields.io "flat" style renderer (offline, no dependencies) ---
const COLORS = {
  brightgreen: '#4c1',
  green: '#97ca00',
  yellowgreen: '#9c1',
  yellow: '#dfb317',
  orange: '#fe7d37',
  red: '#e05d44',
  blue: '#007ec6',
  gray: '#555',
};

const escapeXml = s =>
  String(s).replace(/[<>&'"]/g, ch => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[ch]);

// Approximate Verdana 11px advance widths (shields uses exact font metrics;
// close enough for two-field badges, zero dependencies).
const charWidth = ch =>
  /[ilij|!.,:;'`]/.test(ch)
    ? 3.2
    : /[ftrI()\[\]{}-]/.test(ch)
      ? 4.5
      : /[mwMW]/.test(ch)
        ? 10
        : 6.8;
const textWidth = s => [...s].reduce((w, ch) => w + charWidth(ch), 0);

function renderBadge(label, message, colorName) {
  const height = 20;
  const pad = 6;
  const labelW = Math.round(textWidth(label) + pad * 2);
  const valueW = Math.round(textWidth(message) + pad * 2);
  const width = labelW + valueW;
  const fill = COLORS[colorName] || COLORS.gray;
  const font =
    "font-family='Verdana,Geneva,DejaVu Sans,sans-serif' font-size='11' text-anchor='middle'";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" role="img" aria-label="${escapeXml(label)}: ${escapeXml(message)}">
  <title>${escapeXml(label)}: ${escapeXml(message)}</title>
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="r"><rect width="${width}" height="${height}" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="${height}" fill="#555"/>
    <rect x="${labelW}" width="${valueW}" height="${height}" fill="${fill}"/>
    <rect width="${width}" height="${height}" fill="url(#s)"/>
  </g>
  <g fill="#fff" ${font}>
    <text x="${labelW / 2}" y="15">${escapeXml(label)}</text>
    <text x="${labelW + valueW / 2}" y="15">${escapeXml(message)}</text>
  </g>
</svg>
`;
}

const writeBadge = (file, svg) => {
  writeFileSync(path.join(root, file), svg);
  console.log(`[make-badges] wrote ${file}`);
};

// --- coverage badge (color bands match barikoiapis-golang's CI) ---
const summary = readJson('coverage/coverage-summary.json');
if (summary) {
  const pct = summary.total?.lines?.pct ?? 0;
  const pctInt = Math.floor(pct);
  const color =
    pctInt >= 90 ? 'brightgreen' : pctInt >= 80 ? 'green' : pctInt >= 70 ? 'yellow' : pctInt >= 60 ? 'orange' : 'red';

  writeBadge('coverage-badge.svg', renderBadge('coverage', `${pct.toFixed(2)}%`, color));

  // shields.io JSON endpoint file — unused while the repo is private, kept for
  // the day it goes public (live badge URL documented in the README comment)
  writeFileSync(
    path.join(root, 'coverage.json'),
    `${JSON.stringify({ schemaVersion: 1, label: 'coverage', message: `${pct.toFixed(2)}%`, color }, null, 2)}\n`
  );
} else {
  console.warn('[make-badges] coverage/coverage-summary.json not found — run vitest --coverage first (skipping coverage badge)');
}

// --- tests badge ---
const results = readJson('test-results.json');
if (results) {
  const total = results.numTotalTests ?? 0;
  const passed = results.numPassedTests ?? 0;
  const failed = total - passed;
  const message = failed > 0 ? `${failed} of ${total} failing` : `${total} passing`;
  writeBadge('tests-badge.svg', renderBadge('tests', message, failed > 0 ? 'red' : 'brightgreen'));
} else {
  console.warn('[make-badges] test-results.json not found — run vitest with --reporter=json (skipping tests badge)');
}
