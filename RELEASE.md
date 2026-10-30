# SDK release procedure (`@imazeo/sdk`)

Independent repository: [manishbalodia/imazeo-typescript](https://github.com/manishbalodia/imazeo-typescript).  
npm org: `imazeo` → package `@imazeo/sdk` (public).  
Supported API prefix: `v1`. SemVer lives in this repo (`package.json` + `src/version.ts`).

Do not publish automatically from CI until a protected release workflow is added.
Never overwrite a published version; ship a patch instead.

## Pre-publish checks

```powershell
cd D:\projects\imazeo\sdk-typescript
python scripts\check-release.py
npm ci
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
npm pack --dry-run
```

Confirm pack contents are only the `files` allowlist (no keys, `.env`, or `node_modules`).

## Manual publish (first release `1.0.0`)

1. Clean `main`, equal to the revision you verified.
2. `git tag v1.0.0` and `git push origin main` / `git push origin v1.0.0`
3. `npm login` as a member of the `imazeo` org with publish rights
4. `npm whoami`
5. `npm publish --access public`
6. Verify: `npm view @imazeo/sdk version`

## After publish

Record the Git revision, `npm pack` SHA, and check results. Smoke-install in a
temp folder. If the release is bad, deprecate/yank per npm policy and release a
reviewed patch — do not republish the same version.
