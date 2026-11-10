#!/usr/bin/env node
/**
 * Dual-mode release for @imazeo/sdk (same idea as n8n `npm run release`):
 *
 * Local (default):
 *   Bumps package.json + src/version.ts, commits, tags vX.Y.Z, pushes.
 *   Does NOT publish to npm — GitHub Actions Publish does that with provenance.
 *
 * GitHub Actions:
 *   Detected via GITHUB_ACTIONS=true → npm publish --access public --provenance.
 *
 * PowerShell examples:
 *   $env:RELEASE_MODE="true"; npm run release -- --patch
 *   $env:RELEASE_MODE="true"; npm run release -- --version 1.0.1
 *   $env:RELEASE_MODE="true"; npm run release -- --patch --github-release
 *   $env:RELEASE_MODE="true"; npm run release -- --patch --dry-run
 */

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PACKAGE_JSON = join(ROOT, 'package.json');
const VERSION_TS = join(ROOT, 'src', 'version.ts');
const CHANGELOG = join(ROOT, 'CHANGELOG.md');

function fail(message) {
  console.error(`release: ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });
  if (result.status !== 0) {
    fail(`${command} ${args.join(' ')} failed (exit ${result.status ?? 'null'})`);
  }
  return result;
}

function parseArgs(argv) {
  const opts = {
    bump: null,
    version: null,
    githubRelease: false,
    dryRun: false,
    push: true,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--patch' || arg === '--minor' || arg === '--major') {
      opts.bump = arg.slice(2);
    } else if (arg === '--version') {
      opts.version = argv[++i];
      if (!opts.version) fail('--version requires a SemVer value');
    } else if (arg === '--github-release') {
      opts.githubRelease = true;
    } else if (arg === '--dry-run') {
      opts.dryRun = true;
    } else if (arg === '--no-push') {
      opts.push = false;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      fail(`unknown argument: ${arg}`);
    }
  }
  return opts;
}

function printHelp() {
  console.log(`Usage:
  npm run release -- --patch|--minor|--major
  npm run release -- --version X.Y.Z
  npm run release -- --patch --github-release
  npm run release -- --patch --dry-run
  npm run release -- --patch --no-push

Locally requires RELEASE_MODE=true (PowerShell: $env:RELEASE_MODE="true").
In GitHub Actions, publishes with npm provenance (no bump).`);
}

function parseSemVer(version) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?$/.exec(version);
  if (!match) fail(`invalid SemVer: ${version}`);
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] || null,
  };
}

function bumpVersion(current, bump) {
  const v = parseSemVer(current);
  if (v.prerelease) fail('refusing to auto-bump a prerelease; pass --version');
  if (bump === 'major') return `${v.major + 1}.0.0`;
  if (bump === 'minor') return `${v.major}.${v.minor + 1}.0`;
  if (bump === 'patch') return `${v.major}.${v.minor}.${v.patch + 1}`;
  fail(`unknown bump: ${bump}`);
}

function readPackage() {
  return JSON.parse(readFileSync(PACKAGE_JSON, 'utf8'));
}

function writePackage(pkg) {
  writeFileSync(PACKAGE_JSON, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
}

function syncVersionTs(version) {
  const source = readFileSync(VERSION_TS, 'utf8');
  const next = source.replace(
    /export const SDK_VERSION = ['"][^'"]+['"]/,
    `export const SDK_VERSION = '${version}'`,
  );
  if (next === source && !source.includes(`SDK_VERSION = '${version}'`)) {
    fail('could not update SDK_VERSION in src/version.ts');
  }
  writeFileSync(VERSION_TS, next, 'utf8');
}

function ensureChangelog(version) {
  const text = readFileSync(CHANGELOG, 'utf8');
  if (text.includes(`## ${version}`)) return;
  const stub = `# Changelog

## ${version}

### Changed

- Release packaging and public docs cleanup.

`;
  const body = text.startsWith('# Changelog') ? text.replace(/^# Changelog\s*/m, '') : text;
  writeFileSync(CHANGELOG, `${stub}${body.replace(/^\s+/, '')}`, 'utf8');
}

function publishFromActions() {
  console.log('release: GitHub Actions detected — publishing with provenance');
  run('npm', ['publish', '--access', 'public', '--provenance']);
  console.log('release: publish complete');
}

function releaseLocal(opts) {
  if (process.env.RELEASE_MODE !== 'true') {
    fail(
      'set RELEASE_MODE=true to run a local release (PowerShell: $env:RELEASE_MODE="true")',
    );
  }
  if (!opts.bump && !opts.version) {
    printHelp();
    fail('choose --patch, --minor, --major, or --version X.Y.Z');
  }

  const pkg = readPackage();
  const current = pkg.version;
  let next;
  if (opts.version) {
    parseSemVer(opts.version);
    next = opts.version;
  } else {
    next = bumpVersion(current, opts.bump);
  }
  const tag = `v${next}`;

  console.log(`release: ${current} → ${next} (tag ${tag})`);

  if (opts.dryRun) {
    console.log('release: dry-run only (no file changes, commit, tag, or push)');
    return;
  }

  pkg.version = next;
  writePackage(pkg);
  syncVersionTs(next);
  ensureChangelog(next);

  run('python', ['scripts/check-release.py']);
  run('npm', ['run', 'typecheck']);
  run('npm', ['test']);
  run('npm', ['run', 'build']);

  run('git', ['add', 'package.json', 'src/version.ts', 'CHANGELOG.md']);
  run('git', ['commit', '-m', `Release @imazeo/sdk ${next}.`]);
  run('git', ['tag', '-a', tag, '-m', `@imazeo/sdk ${next}`]);

  if (opts.push) {
    run('git', ['push', 'origin', 'HEAD']);
    run('git', ['push', 'origin', tag]);
    console.log(`release: pushed ${tag} — GitHub Actions Publish npm will publish to the registry`);
  } else {
    console.log('release: skipped push (--no-push). Push HEAD and the tag when ready.');
  }

  if (opts.githubRelease) {
    const gh = spawnSync('gh', ['--version'], {
      cwd: ROOT,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    });
    if (gh.status !== 0) {
      fail('gh CLI not available; install GitHub CLI or create the release in the GitHub UI');
    }
    if (!opts.push) {
      fail('--github-release requires push (omit --no-push)');
    }
    run('gh', [
      'release',
      'create',
      tag,
      '--title',
      `@imazeo/sdk ${next}`,
      '--notes',
      `Release ${next} of @imazeo/sdk.\n\nnpm: https://www.npmjs.com/package/@imazeo/sdk/v/${next}`,
    ]);
    console.log(`release: GitHub Release ${tag} created`);
  } else {
    console.log(
      `release: optional GitHub Release — run: gh release create ${tag} --title "@imazeo/sdk ${next}" --generate-notes`,
    );
    console.log(
      'release: or use GitHub UI → Releases → Draft a new release from this tag',
    );
  }
}

const inActions = process.env.GITHUB_ACTIONS === 'true';
const opts = parseArgs(process.argv.slice(2));

if (inActions) {
  if (opts.bump || opts.version || opts.githubRelease || opts.dryRun || !opts.push) {
    fail('bump/github-release flags are local-only; Actions mode only publishes');
  }
  publishFromActions();
} else {
  releaseLocal(opts);
}
