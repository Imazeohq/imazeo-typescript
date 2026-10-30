# @imazeo/sdk

Official **server-side** TypeScript/JavaScript SDK for Imazeo.

|                |                                  |
| -------------- | -------------------------------- |
| Package        | `@imazeo/sdk`                    |
| SDK version    | `1.0.0`                          |
| Default API    | `v1`                             |
| Supported APIs | `v1`                             |
| Runtime        | Node.js **20+** (native `fetch`) |
| Registry       | [npm](https://www.npmjs.com/package/@imazeo/sdk) |
| Source         | [GitHub](https://github.com/manishbalodia/imazeo-typescript) |

> **Security:** Secret API keys (`X-API-Key`) are for trusted servers only.
> Do **not** ship this client with a secret key in browsers.

Integration contract and learning path: [GUIDE.md](GUIDE.md).

## Install

```bash
npm install @imazeo/sdk
```

Requires Node.js 20+. Create a project API key in the Imazeo customer portal.
Default API origin is `https://api.imazeo.com` (override with `baseUrl` when needed).

## Learning path

Read the self-contained [integration guide](GUIDE.md) for project/key setup,
language examples, PDF response types, pagination, output retention, troubleshooting
and production practices.

The default HTTP transport refuses redirects so credentials stay on the configured
API origin.

## Quick start

```ts
import { writeFile } from 'node:fs/promises';
import { Imazeo } from '@imazeo/sdk';

const client = new Imazeo({
  apiKey: process.env.IMAZEO_API_KEY!,
  baseUrl: process.env.IMAZEO_API_ORIGIN!, // required deployment configuration
  // projectId: '…', // optional; otherwise resolved via /v1/api-key/context
});

const qr = await client.qr.generate({
  content: 'https://imazeo.com',
  format: 'png',
  size: 256,
});
await writeFile('qr.png', qr.data);
```

## Authentication

```ts
new Imazeo({ apiKey: process.env.IMAZEO_API_KEY! });
```

Sends `X-API-Key` only. Never send `Authorization` together with an API key
(backend rejects that combination).

## Resources

| Resource            | Methods                                                                       |
| ------------------- | ----------------------------------------------------------------------------- |
| `client.context`    | `get()` → project/key IDs                                                     |
| `client.images`     | `upload`, `list` (`page`/`limit`/`q`), `get`, `delete`, `download`            |
| `client.transforms` | `create`, `list`, `get`, `download` (`ifNoneMatch` → `notModified`), `delete` |
| `client.qr`         | `generate`                                                                    |
| `client.barcodes`   | `generate`                                                                    |
| `client.pdf`        | `info`, `render`, `merge`, `extract`                                          |

### Upload + transform

```ts
const image = await client.images.upload(bytes, {
  filename: 'photo.jpg',
  contentType: 'image/jpeg',
});

const out = await client.transforms.create({
  imageId: image._id,
  mode: 'EPHEMERAL',
  transform: { width: 1200, format: 'webp', quality: 85 },
});
// out.data → Uint8Array
```

### Remote URL transform

```ts
const out = await client.transforms.create({
  url: 'https://example.com/image.jpg',
  transform: { width: 640, format: 'jpeg' },
});
```

### PDF

```ts
const info = await client.pdf.info(pdfBytes);
const page = await client.pdf.render(pdfBytes, { pages: '1', format: 'png' });
const merged = await client.pdf.merge([pdfA, pdfB]);
const extracted = await client.pdf.extract(pdfBytes, { pages: '1,2' });
```

## Errors

```ts
import { ImazeoError, RateLimitError } from '@imazeo/sdk';

try {
  await client.images.get(id);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.error(error.code, error.requestId);
  } else if (error instanceof ImazeoError) {
    console.error(error.status, error.code, error.message);
  }
}
```

## Configuration

| Option       | Default                  | Notes                                  |
| ------------ | ------------------------ | -------------------------------------- |
| `apiKey`     | required                 | Secret key                             |
| `projectId`  | from context             | Path project                           |
| `baseUrl`    | `https://api.imazeo.com` | Origin only; `/v1` stripped if present |
| `apiVersion` | `v1`                     | Allowlisted                            |
| `timeoutMs`  | `60000`                  | PDF uses 120s; QR/barcode 30s          |
| `appName`    | —                        | Appended to User-Agent                 |
| `fetch`      | global `fetch`           | Tests / custom agents                  |

## API version vs package version

- **API** path version: `v1` (configured via `apiVersion`)
- **SDK** SemVer: `package.json` → `1.0.0`

`Imazeo.apiCompatibility` reports supported API versions.

## Not included

Portal JWT APIs (projects CRUD, API-key management, usage, plans, tickets, auth),
admin APIs, and browser secret-key usage.

## Development

```bash
npm install
npm test
npm run build
```

OpenAPI sync notes: [`openapi/README.md`](openapi/README.md).

## License

MIT

## Media contract update — 2026-10-02

Barcode generation requires `type` and string `content`; optional `format` is
`png` or `svg` (default `png`), and `includeText` is a boolean (default `true`).
The old `data`, `output` and `includetext` fields are removed before release.
PDF merge sends repeated `file` parts in order. Omit optional fields for defaults;
JSON numbers/booleans are not coerced and top-level optional nulls are rejected.
Barcode scale and image hue are integers. Methods retain language-specific names.
The reviewed API-key-only contract is bundled in `openapi/backend.json`.

```typescript
await client.barcodes.generate({
  type: 'code128',
  content: 'IMAZEO-2026',
  format: 'svg',
  includeText: false,
});
```
