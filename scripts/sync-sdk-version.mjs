#!/usr/bin/env node
/** Keep src/version.ts SDK_VERSION in sync after release-it bumps package.json. */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const path = join(root, 'src', 'version.ts');
const source = readFileSync(path, 'utf8');
const next = source.replace(
  /export const SDK_VERSION = ['"][^'"]+['"]/,
  `export const SDK_VERSION = '${version}'`,
);
if (!next.includes(`SDK_VERSION = '${version}'`)) {
  console.error('sync-sdk-version: failed to update src/version.ts');
  process.exit(1);
}
writeFileSync(path, next, 'utf8');
const add = spawnSync('git', ['add', 'src/version.ts'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (add.status !== 0) process.exit(add.status ?? 1);
console.log(`sync-sdk-version: SDK_VERSION → ${version}`);
