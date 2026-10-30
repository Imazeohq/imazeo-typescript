# OpenAPI contract sync

This SDK does not embed a runtime dependency on the backend repository.

To refresh after a reviewed backend release:

1. Build the backend (`npm run build` in `backend/`).
2. Export OpenAPI (same approach as Customer/Admin):

```sh
# from customer/ or a copy of export-backend.mjs adapted for this repo
node scripts/export-backend.mjs ../backend
```

3. Copy `openapi.json` / `backend.json` into this folder as `backend.json`.
4. Update `contract-meta.json` (`generatedFromBackend` date/hash).
5. Diff SDK models against new schemas; bump SemVer if public types change.
6. Run `npm test && npm run build`.

Do not hand-edit generated consumer types from OpenAPI into the public API without review.
