# Changelog

## Unpublished production preparation — 2026-10-09

- Default transports refuse redirects so project API keys remain on the configured origin.
- Native verification CI and independent package/version/tag checks are included.
- Portable release instructions retain registry/repository ownership and native gates.
- Compatible source-map tooling patch and reviewed OpenAPI package inclusion.

## 1.0.0

### Added

- Initial official TypeScript/JavaScript SDK (`@imazeo/sdk`)
- Resources: `context`, `images`, `transforms`, `qr`, `barcodes`, `pdf`
- Typed errors mapped from Imazeo API envelopes
- API version allowlist (`v1`) separate from SDK SemVer
- Multipart uploads with required `X-Upload-Length`
- Binary response helpers for images/PDF/QR/barcode
- Image list `q` filename-prefix filter
- Transform download `If-None-Match` → HTTP 304 as `BinaryResult.notModified`

### Deferred (API-key routes exist; not in SDK_BEHAVIOR §1)

- Tool artifacts CRUD/download
- Project outputs list

### API compatibility

- Default API: `v1`
- Supported API versions: `v1`

## Unreleased — media contract review

- Barcode: `type`, `content`, `format`, `includeText`; explicit JSON types.
- PDF merge uses repeated `file` parts; refreshed reviewed contract snapshot.
- Correct integer model types for barcode scale/image hue where applicable.
