# SDK release procedure (`@imazeo/sdk`)

Independent repository: [Imazeohq/imazeo-typescript](https://github.com/Imazeohq/imazeo-typescript).  
npm package: [`@imazeo/sdk`](https://www.npmjs.com/package/@imazeo/sdk) (public, org `imazeo`).  
Supported API prefix: `v1`. SemVer lives in this repo (`package.json` + `src/version.ts`).

Prefer **GitHub Actions Trusted Publishing** (OIDC + provenance). Never overwrite a
published version; ship a patch instead.

## One-time: Trusted Publisher

On npmjs.com → [`@imazeo/sdk`](https://www.npmjs.com/package/@imazeo/sdk) → **Settings** → **Trusted Publisher** → **GitHub Actions**:

| Field | Value |
| --- | --- |
| Repository owner | `Imazeohq` |
| Repository name | `imazeo-typescript` |
| Workflow filename | `publish.yml` |
| Environment | leave empty |

## Pre-publish checks

CI on `main` / PRs runs verification. Locally (optional):

```powershell
python scripts/check-release.py
npm ci
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
```

## Release from PowerShell (recommended)

Same idea as the n8n package: local `npm run release` bumps/tags/pushes; Actions publishes.

```powershell
cd D:\projects\imazeo\sdk-typescript

# Commit any pending doc/code changes on main first, then:

$env:RELEASE_MODE = "true"
npm run release -- --patch
# or:  npm run release -- --minor
# or:  npm run release -- --major
# or:  npm run release -- --version 1.0.1

# Also create a GitHub Release for the tag:
# npm run release -- --patch --github-release
```

What local release does:

1. Bumps `package.json` and `src/version.ts` together
2. Ensures a `CHANGELOG.md` section for the new version
3. Runs check-release / typecheck / test / build
4. Commits `Release @imazeo/sdk X.Y.Z.`
5. Creates annotated tag `vX.Y.Z` and pushes commit + tag
6. Does **not** publish to npm locally

GitHub Actions **Publish npm** then runs `npm run release` in CI → `npm publish --access public --provenance`.

Dry run / no push:

```powershell
$env:RELEASE_MODE = "true"
npm run release -- --patch --dry-run
npm run release -- --patch --no-push
```

## Release using GitHub only

Use this when the version bump commit is already on `main` (or you are tagging an existing commit).

### Option A — tag push

```powershell
git tag -a v1.0.1 -m "@imazeo/sdk 1.0.1"
git push origin v1.0.1
```

`package.json` / `src/version.ts` on that commit must already be `1.0.1`, and the tag must be exactly `v1.0.1`.

### Option B — GitHub Releases UI

1. Open https://github.com/Imazeohq/imazeo-typescript/releases/new
2. Choose tag `v1.0.1` (create tag from `main` if needed)
3. Title e.g. `@imazeo/sdk 1.0.1`
4. Publish release

Pushing/creating the `v*` tag starts **Publish npm**.

### Option C — workflow_dispatch

1. Actions → **Publish npm** → **Run workflow**
2. Optional input **tag**: `v1.0.1` (recommended — checks out that tag)
3. Run

## After publish

```powershell
npm view @imazeo/sdk version
```

Package page: https://www.npmjs.com/package/@imazeo/sdk  

If the release is bad, deprecate per npm policy and ship a reviewed patch.
