# SDK release procedure (`@imazeo/sdk`)

Independent repository: [Imazeohq/imazeo-typescript](https://github.com/Imazeohq/imazeo-typescript).  
npm package: [`@imazeo/sdk`](https://www.npmjs.com/package/@imazeo/sdk) (public, org `imazeo`).  
Supported API prefix: `v1`. SemVer lives in this repo (`package.json` + `src/version.ts`).

Prefer **GitHub Actions Trusted Publishing** (OIDC + provenance). Never overwrite a
published version; ship a patch instead.

## Pre-publish checks

CI on `main` / PRs runs verification. Locally (optional):

```bash
python scripts/check-release.py
npm ci
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
```

## Automated publish (recommended)

Workflow: [`.github/workflows/publish.yml`](.github/workflows/publish.yml)

1. On npmjs.com → `@imazeo/sdk` → **Settings** → **Trusted Publisher** → **GitHub Actions**
   - Organization: `Imazeohq`
   - Repository: `imazeo-typescript`
   - Workflow filename: `publish.yml`
   - Environment: leave empty (unless you add one)
2. Tag and push:

   ```bash
   git tag -a v1.0.1 -m "@imazeo/sdk 1.0.1"
   git push origin v1.0.1
   ```

3. Actions → **Publish npm** runs tests and `npm publish --access public --provenance`.

Manual fallback (not preferred): `npm login` then `npm publish --access public`.

## After publish

Verify: `npm view @imazeo/sdk version` / https://www.npmjs.com/package/@imazeo/sdk  
If the release is bad, deprecate per npm policy and ship a reviewed patch.
