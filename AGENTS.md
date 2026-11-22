# @imazeo/sdk — agent notes

Independent public package for the Imazeo API-key client.

- Contract: published API `v1` / OpenAPI snapshot in [`openapi/backend.json`](openapi/backend.json)
- Scope: project API-key context, media, credit quotes, operations, conversions, dynamic QR, artifacts and outputs
- Do not add admin or customer JWT portal APIs
- Do not publish without maintainer approval — see [RELEASE.md](RELEASE.md)
- Release: `$env:RELEASE_MODE="true"; npm run release` (syncs `src/version.ts`); Actions publishes with provenance
