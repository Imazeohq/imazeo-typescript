import { describe, expect, it } from 'vitest';
import { Imazeo } from '../src/index.js';

const key = 'c37368a9-ed6f-4a78-9fb0-bb577368bde9';
const quoteId = 'b90144bd-1ef3-49db-84fc-28de61bb1e99';
function client(
  handler: (url: URL, init: RequestInit) => Response | Promise<Response>,
) {
  return new Imazeo({
    apiKey: 'test-key',
    projectId: 'project',
    fetch: (async (url, init) => {
      expect(new Headers(init?.headers).get('X-API-Key')).toBe('test-key');
      expect(new Headers(init?.headers).has('Authorization')).toBe(false);
      expect(init?.redirect).toBe('error');
      return handler(new URL(String(url)), init!);
    }) as typeof fetch,
  });
}
const json = (data: unknown, meta: object = {}) =>
  new Response(
    JSON.stringify({
      success: true,
      data,
      meta: { requestId: 'request', ...meta },
    }),
    { headers: { 'content-type': 'application/json' } },
  );

describe('project features', () => {
  it('binds conversions to quotes, preserves false options, and uploads exact bytes', async () => {
    const sdk = client(async (url, init) => {
      expect(url.pathname).toBe('/v1/projects/project/conversions');
      expect(url.searchParams.get('renderHeaders')).toBe('false');
      const headers = new Headers(init.headers);
      expect(headers.get('Idempotency-Key')).toBe(key);
      expect(headers.get('X-Quote-ID')).toBe(quoteId);
      expect(headers.get('X-Upload-Length')).toBe('3');
      const file = (init.body as FormData).get('file') as File;
      expect(Array.from(new Uint8Array(await file.arrayBuffer()))).toEqual([
        1, 2, 3,
      ]);
      return json({ id: 'job', status: 'queued' });
    });
    expect(
      (
        await sdk.conversions.docx(
          new Uint8Array([1, 2, 3]),
          { idempotencyKey: key, quoteId },
          { renderHeaders: false },
        )
      ).status,
    ).toBe('queued');
  });
  it('uses engine paths and keeps website URLs in the body', async () => {
    const paths: string[] = [];
    const sdk = client((url, init) => {
      paths.push(url.pathname);
      if (url.pathname.endsWith('/website')) {
        expect(JSON.parse(init.body as string)).toEqual({
          url: 'https://imazeo.com',
        });
        expect(url.searchParams.get('javascriptEnabled')).toBe('false');
      }
      return json({ id: 'job' });
    });
    const request = { idempotencyKey: key, quoteId };
    await sdk.conversions.xlsx(new Uint8Array([1]), request);
    await sdk.conversions.pptx(new Uint8Array([1]), request);
    await sdk.conversions.website('https://imazeo.com', request, {
      javascriptEnabled: false,
    });
    expect(paths.map((p) => p.split('/').at(-1))).toEqual([
      'xlsx',
      'pptx',
      'website',
    ]);
  });
  it('retains explicit list pagination and scan filters', async () => {
    const sdk = client((url, init) => {
      if (url.pathname.endsWith('/analytics/export')) {
        expect(url.searchParams.get('bot')).toBe('false');
        expect(url.searchParams.get('browser')).toBe('chrome');
        return new Response('date,count\n', {
          headers: { 'content-type': 'text/csv' },
        });
      }
      expect(init.method).toBe('GET');
      expect(url.searchParams.get('page')).toBe('2');
      return json([{ id: 'code' }], {
        page: 2,
        limit: 10,
        total: 11,
        pages: 2,
      });
    });
    const page = await sdk.dynamicCodes.list({
      page: 2,
      limit: 10,
      status: 'active',
    });
    expect(page).toMatchObject({
      page: 2,
      limit: 10,
      total: 11,
      pages: 2,
      requestId: 'request',
    });
    const csv = await sdk.dynamicCodes.exportAnalytics('code', {
      bot: false,
      browser: 'chrome',
    });
    expect(new TextDecoder().decode(csv.data)).toBe('date,count\n');
  });
  it('sends dynamic revisions and idempotency in distinct fields', async () => {
    const sdk = client((_url, init) => {
      expect(init.method).toBe('PATCH');
      expect(new Headers(init.headers).get('Idempotency-Key')).toBe(key);
      expect(JSON.parse(init.body as string)).toEqual({
        expectedRevision: 0,
        analyticsEnabled: false,
        status: 'paused',
      });
      return json({ revision: 1 });
    });
    expect(
      (
        await sdk.dynamicCodes.update(
          'code',
          { expectedRevision: 0, analyticsEnabled: false, status: 'paused' },
          key,
        )
      ).revision,
    ).toBe(1);
  });
  it('persists artifacts with multipart metadata and JSON snapshots', async () => {
    const sdk = client((_url, init) => {
      const form = init.body as FormData;
      expect(form.get('kind')).toBe('qr');
      expect(form.get('displayName')).toBe('Company QR');
      expect(form.get('requestSnapshot')).toBe('{"format":"png"}');
      return json({ _id: 'saved' });
    });
    expect(
      (
        await sdk.artifacts.save(new Uint8Array([1]), {
          kind: 'qr',
          displayName: 'Company QR',
          contentType: 'image/png',
          requestSnapshot: { format: 'png' },
        })
      )._id,
    ).toBe('saved');
  });
  it('recovers structured operation results and preserves code designer headers', async () => {
    const sdk = client((url, init) => {
      if (url.pathname.endsWith('/result'))
        return json({ pages: [{ pageNumber: 1 }] });
      expect(new Headers(init.headers).get('X-Quote-ID')).toBe(quoteId);
      expect(JSON.parse(init.body as string)).toMatchObject({
        transparent: true,
        design: { schemaVersion: 1, template: 'rounded', templateVersion: 1 },
      });
      return new Response('image', {
        headers: {
          'content-type': 'image/png',
          'x-operation-id': 'op',
          'x-code-scan': 'exact',
        },
      });
    });
    expect(await sdk.operations.result('op')).toEqual({
      pages: [{ pageNumber: 1 }],
    });
    const qr = await sdk.qr.generate(
      {
        content: 'https://imazeo.com',
        transparent: true,
        design: { schemaVersion: 1, template: 'rounded', templateVersion: 1 },
      },
      undefined,
      { quoteId },
    );
    expect(qr.headers['x-operation-id']).toBe('op');
    expect(qr.headers['x-code-scan']).toBe('exact');
  });
});
