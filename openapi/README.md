# OpenAPI contract sync

This package does not depend on a live backend at install time. It ships a reviewed
API-key OpenAPI snapshot as [`backend.json`](backend.json).

To refresh after a reviewed API release:

1. Export OpenAPI from the published Imazeo API (or a reviewed release artifact).
2. Replace `backend.json` in this folder.
3. Update `contract-meta.json` (generation date / source hash) when present.
4. Diff SDK models against the new schemas; bump SemVer if public types change.
5. Run `npm test && npm run build`.

Do not expand the public SDK surface to admin or customer JWT portal APIs.
