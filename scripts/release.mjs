#!/usr/bin/env node
/**
 * Dual-mode release for @imazeo/sdk.
 *
 * Local:
 *   $env:RELEASE_MODE="true"; npm run release
 *   → interactive bump + GitHub Release via release-it
 *   → commit, tag, push (does not npm publish)
 *
 * GitHub Actions:
 *   npm run release → npm publish --access public --provenance
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const releaseIt = join(root, 'node_modules', 'release-it', 'bin', 'release-it.js');

function fail(message) {
  console.error(`release: ${message}`);
  process.exit(1);
}

function run(command, args, { env = {}, shell = false } = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell,
    env: { ...process.env, ...env },
  });
  if (result.error) {
    fail(`failed to start ${command}: ${result.error.message}`);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.GITHUB_ACTIONS === 'true') {
  // shell:true is reliable cross-platform for the npm.cmd shim on Windows runners too
  run('npm', ['publish', '--access', 'public', '--provenance'], {
    shell: true,
    env: {
      RELEASE_MODE: 'true',
      NPM_CONFIG_PROVENANCE: 'true',
    },
  });
  process.exit(0);
}

if (process.env.RELEASE_MODE !== 'true') {
  fail('set RELEASE_MODE=true (PowerShell: $env:RELEASE_MODE="true")');
}

if (!existsSync(releaseIt)) {
  fail('release-it is not installed; run npm install');
}

function capture(command, args) {
  return spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    shell: false,
    env: process.env,
  });
}

// GitHub Release is created by release-it only (not Actions). Refresh tags first
// so the bump prompt does not reuse a tag that already exists on origin.
const fetch = capture('git', ['fetch', 'origin', 'main', '--tags', '--prune']);
if (fetch.status !== 0) {
  fail('git fetch origin main --tags failed; check network/auth');
}
const behind = capture('git', ['rev-list', '--count', 'HEAD..origin/main']);
if (behind.status === 0 && Number((behind.stdout || '').trim()) > 0) {
  fail('main is behind origin/main; pull/rebase before release');
}

// Invoke the JS bin with node — avoids Windows EINVAL on npx.cmd / .cmd shims.
run(process.execPath, [releaseIt]);
