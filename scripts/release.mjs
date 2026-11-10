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
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.GITHUB_ACTIONS === 'true') {
  run('npm', ['publish', '--access', 'public', '--provenance'], {
    RELEASE_MODE: 'true',
    NPM_CONFIG_PROVENANCE: 'true',
  });
  process.exit(0);
}

if (process.env.RELEASE_MODE !== 'true') {
  console.error('release: set RELEASE_MODE=true (PowerShell: $env:RELEASE_MODE="true")');
  process.exit(1);
}

// release-it prompts for version bump; GitHub Release is enabled (confirm in UI).
run('npx', [
  'release-it',
  '--git.requireBranch=main',
  '--git.requireCleanWorkingDir',
  '--git.requireUpstream',
  '--git.commit',
  '--git.tag',
  '--git.push',
  '--git.commitMessage=Release @imazeo/sdk ${version}.',
  '--git.tagName=v${version}',
  '--git.tagAnnotation=@imazeo/sdk ${version}',
  '--github.release',
  '--npm.publish=false',
  '--hooks.before:init=npm run typecheck && npm test && npm run build',
  '--hooks.after:bump=node scripts/sync-sdk-version.mjs',
]);
