#!/usr/bin/env node
/* eslint-disable no-undef */
/* eslint-disable no-console */

import { execSync } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '..');
const DIST_DIR = resolve(ROOT_DIR, 'dist');

// Clean the dist directory
console.log('Cleaning dist directory...');
execSync('npm run clean', { stdio: 'inherit', cwd: ROOT_DIR });

// Build TypeScript definitions
console.log('Building TypeScript definitions...');
execSync('tsc -p tsconfig.build.json', { stdio: 'inherit', cwd: ROOT_DIR });

// Build ESM version
console.log('Building ESM version...');
execSync('BABEL_ENV=esm-strict npx babel src --out-dir dist --extensions .js,.jsx,.ts,.tsx --copy-files --source-maps', 
  { stdio: 'inherit', cwd: ROOT_DIR });

// Build CommonJS version
console.log('Building CommonJS version...');
execSync('BABEL_ENV=cjs npx babel src --out-dir dist/cjs --extensions .js,.jsx,.ts,.tsx --copy-files --source-maps', 
  { stdio: 'inherit', cwd: ROOT_DIR });

// Create the CJS entry point file
fs.writeFileSync(
  resolve(DIST_DIR, 'index.cjs'),
  `'use strict';
Object.defineProperty(exports, '__esModule', { value: true });

const cjs = require('./cjs/index.js');

if (cjs.default) module.exports = cjs.default;
Object.keys(cjs).forEach(key => {
  module.exports[key] = cjs[key];
});
`
);

// Process CSS files
console.log('Processing CSS files...');
execSync('node scripts/modify-css.js', { stdio: 'inherit', cwd: ROOT_DIR });

// Clean up unnecessary files
console.log('Cleaning up unnecessary files...');

// Remove source maps
const removeSourceMaps = (directory) => {
  execSync(`find ${directory} -name "*.map" -type f -delete`, { 
    stdio: 'inherit', 
    cwd: ROOT_DIR 
  });
};

removeSourceMaps(DIST_DIR);

console.log('Build completed successfully!'); 