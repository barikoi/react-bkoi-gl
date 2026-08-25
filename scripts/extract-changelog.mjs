#!/usr/bin/env node
/**
 * Changelog-driven release helper.
 *
 * Extracts the top `## [x.y.z] - <date>` entry from CHANGELOG.md and appends
 * `version=` and `notes=` outputs to $GITHUB_OUTPUT (GitHub Actions step outputs).
 * Run locally without GITHUB_OUTPUT set to just print the extraction (dry-run).
 *
 * Plain string surgery — no lazy-regex + multiline-$ pitfalls.
 */
import { appendFileSync, readFileSync } from 'node:fs';

const text = readFileSync('CHANGELOG.md', 'utf8');

const headingMatch = text.match(/^## \[([^\]]+)\][^\n]*/m);
if (!headingMatch) {
  console.error('No "## [x.y.z]" heading found in CHANGELOG.md');
  process.exit(1);
}

const version = headingMatch[1];
const headingLine = headingMatch[0];

if (headingLine.toLowerCase().includes('unreleased')) {
  console.error('Top CHANGELOG entry is still "unreleased" — set a real date before tagging');
  process.exit(1);
}

const bodyStart = headingMatch.index + headingLine.length;
const nextHeading = text.indexOf('\n## [', bodyStart);
const body = nextHeading === -1 ? text.slice(bodyStart) : text.slice(bodyStart, nextHeading);
const notes = body.trim();

if (!notes) {
  console.error(`CHANGELOG entry for ${version} has no body — release notes would be empty`);
  process.exit(1);
}

const githubOutput = process.env.GITHUB_OUTPUT;
if (githubOutput) {
  appendFileSync(githubOutput, `version<<__CHG_EOF__\n${version}\n__CHG_EOF__\n`);
  appendFileSync(githubOutput, `notes<<__CHG_EOF__\n${notes}\n__CHG_EOF__\n`);
  console.log(`extracted version=${version} (${notes.length} chars of notes) -> GITHUB_OUTPUT`);
} else {
  console.log(`version: ${version}`);
  console.log('--- notes ---');
  console.log(notes);
}
