#!/usr/bin/env node
/**
 * Generates the coverage badge artifacts from Vitest's
 * coverage/coverage-summary.json (v8 provider, json-summary reporter):
 *
 *  - coverage.json       shields.io JSON endpoint file. CI publishes it to the
 *                        orphan `badges` branch (force-pushed); locally it is
 *                        written to the repo root for preview and is gitignored.
 *                        Requires a public repo to render off-GitHub.
 *  - coverage-badge.svg  self-contained shields-style flat badge, committed to
 *                        the repo. The README references it by relative path,
 *                        which GitHub renders with the viewer's session — so
 *                        it works on private repos (on github.com) with no
 *                        external fetch.
 *
 * Color thresholds match the barikoiapis-golang CI so coverage colors are
 * consistent across Barikoi repos.
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

const COLORS = {
  brightgreen: '#4c1',
  green: '#97ca00',
  yellow: '#dfb317',
  orange: '#fe7d37',
  red: '#e05d44',
};

const label = 'coverage';
const message = `${pct.toFixed(2)}%`;

const badge = {
  schemaVersion: 1,
  label,
  message,
  color,
};

const jsonPath = path.join(root, 'coverage.json');
writeFileSync(jsonPath, `${JSON.stringify(badge, null, 2)}\n`);
console.log(`[make-coverage-badge] wrote ${jsonPath} (${message}, ${color})`);

// --- self-contained SVG badge (shields.io "flat" style, rendered offline) ---
const escapeXml = s =>
  String(s).replace(/[<>&'"]/g, ch => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[ch]);

// Approximate Verdana 11px advance widths (shields uses exact font metrics;
// this is close enough for a two-field badge and needs zero dependencies).
const charWidth = ch =>
  /[ilij|!.,:;'`]/.test(ch)
    ? 3.2
    : /[ftrI()\[\]{}-]/.test(ch)
      ? 4.5
      : /[mwMW]/.test(ch)
        ? 10
        : 6.8;
const textWidth = s => [...s].reduce((w, ch) => w + charWidth(ch), 0);

const height = 20;
const pad = 6;
const labelW = Math.round(textWidth(label) + pad * 2);
const valueW = Math.round(textWidth(message) + pad * 2);
const width = labelW + valueW;
const rx = 3;
const fill = COLORS[color];
const font =
  "font-family='Verdana,Geneva,DejaVu Sans,sans-serif' font-size='11' text-anchor='middle'";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" role="img" aria-label="coverage: ${escapeXml(message)}">
  <title>coverage: ${escapeXml(message)}</title>
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="r"><rect width="${width}" height="${height}" rx="${rx}" fill="#fff"/></clipPath>
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

const svgPath = path.join(root, 'coverage-badge.svg');
writeFileSync(svgPath, svg);
console.log(`[make-coverage-badge] wrote ${svgPath}`);
