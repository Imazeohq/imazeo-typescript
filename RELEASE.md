# SDK release procedure (`@imazeo/sdk`)

Independent repository: [Imazeohq/imazeo-typescript](https://github.com/Imazeohq/imazeo-typescript).  
npm package: [`@imazeo/sdk`](https://www.npmjs.com/package/@imazeo/sdk) (public, org `imazeo`).

Prefer **GitHub Actions Trusted Publishing** (OIDC + provenance). Never overwrite a
published version; ship a patch instead.

## One-time: Trusted Publisher

npmjs.com → `@imazeo/sdk` → **Settings** → **Trusted Publisher** → **GitHub Actions**:

| Field | Value |
| --- | --- |
| Repository owner | `Imazeohq` |
| Repository name | `imazeo-typescript` |
| Workflow filename | `publish.yml` |
| Environment | leave empty |

## Release (PowerShell)

Commit your work on `main` first (clean working tree required).

```powershell
$env:RELEASE_MODE = "true"
npm run release
```

You will be prompted for version bump and GitHub Release.  
This syncs `src/version.ts`, commits, tags `vX.Y.Z`, and pushes.  
It does **not** publish to npm — **Actions → Publish npm** does that with provenance.

## Release from GitHub only

If the version bump is already on `main`:

1. **Releases** → Draft a new release → tag `vX.Y.Z` → Publish  
   or
2. **Actions** → **Publish npm** → **Run workflow** (optional tag `vX.Y.Z`)

## After publish

```powershell
npm view @imazeo/sdk version
```
