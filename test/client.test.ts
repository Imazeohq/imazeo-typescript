import { describe, expect, it, vi } from 'vitest';
import { Imazeo } from '../src/index.js';
import {
  AuthenticationError,
  RateLimitError,
  ValidationError,
} from '../src/errors.js';
import { normalizeBaseUrl } from '../src/http/transport.js';
import { SDK_VERSION } from '../src/version.js';

function jsonResponse(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  const body =
    status < 400
      ? { success: true, data, meta: { requestId: 'req_test' } }
      : {
          success: false,
          error: data,
          meta: { requestId: 'req_test' },
        };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'x-request-id': 'req_test',
      ...headers,
    },
  });
}

describe('Imazeo client', () => {
  it('normalizes baseUrl and strips /v1', () => {
    expect(normalizeBaseUrl('https://api.example.com/')).toBe(
      'https://api.example.com',
    );
    expect(normalizeBaseUrl('https://api.example.com/v1')).toBe(
      'https://api.example.com',
    );
    expect(() => normalizeBaseUrl('ftp://x')).toThrow();
  });

  it('rejects unsupported apiVersion', () => {
    expect(
      () =>
        new Imazeo({
          apiKey: 'key',
          apiVersion: 'v9' as 'v1',
        }),
    ).toThrow(/Unsupported apiVersion/);
  });

  it('sends X-API-Key and User-Agent', async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe('https://api.example.com/v1/api-key/context');
      const headers = new Headers(init?.headers);
      expect(headers.get('X-API-Key')).toBe('secret-key');
      expect(headers.get('User-Agent')).toBe(`Imazeo-TypeScript/${SDK_VERSION}`);
      expect(headers.get('Authorization')).toBeNull();
      expect(init?.redirect).toBe('error');
      return jsonResponse({
        projectId: 'proj_1',
        keyId: 'key_1',
      });
    });
    const client = new Imazeo({
      apiKey: 'secret-key',
      baseUrl: 'https://api.example.com',
      fetch: fetchMock as unknown as typeof fetch,
    });
    const ctx = await client.context.get();
    expect(ctx.projectId).toBe('proj_1');
  });

  it('resolves projectId from context when omitted', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/api-key/context'))
        return jsonResponse({
          projectId: 'proj_auto',
          keyId: 'k',
        });
      expect(url).toContain('/v1/projects/proj_auto/images?');
      return jsonResponse([], 200);
    });
    const client = new Imazeo({
      apiKey: 'k',
      baseUrl: 'https://api.example.com',
      fetch: fetchMock as unknown as typeof fetch,
    });
    const page = await client.images.list({ page: 1, limit: 10 });
    expect(page.items).toEqual([]);
    expect(page.requestId).toBe('req_test');
  });

  it('uploads with X-Upload-Length and multipart file field', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get('X-Upload-Length')).toBe('4');
      expect(init?.body).toBeInstanceOf(FormData);
      const form = init!.body as FormData;
      expect(form.get('file')).toBeTruthy();
      return jsonResponse(
        {
          _id: 'img_1',
          projectId: 'p1',
          sourceType: 'upload',
          originalName: 'a.png',
          bytes: 4,
          sha256: 'abc',
          metadata: {
            format: 'png',
            mimeType: 'image/png',
            width: 1,
            height: 1,
            frames: 1,
            pixelCount: 1,
            hasAlpha: false,
            orientation: null,
          },
          status: 'ready',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        201,
      );
    });
    const client = new Imazeo({
      apiKey: 'k',
      projectId: 'p1',
      baseUrl: 'https://api.example.com',
      fetch: fetchMock as unknown as typeof fetch,
    });
    const image = await client.images.upload(bytes, {
      filename: 'a.png',
      contentType: 'image/png',
    });
    expect(image._id).toBe('img_1');
  });

  it('maps error envelopes to typed errors', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ code: 'API_KEY_INVALID', message: 'bad key' }, 401),
    );
    const client = new Imazeo({
      apiKey: 'k',
      projectId: 'p',
      baseUrl: 'https://api.example.com',
      fetch: fetchMock as unknown as typeof fetch,
    });
    await expect(client.images.get('x')).rejects.toBeInstanceOf(
      AuthenticationError,
    );

    const rate = vi.fn(async () =>
      jsonResponse({ code: 'RATE_LIMIT_EXCEEDED', message: 'slow down' }, 429),
    );
    const client2 = new Imazeo({
      apiKey: 'k',
      projectId: 'p',
      baseUrl: 'https://api.example.com',
      fetch: rate as unknown as typeof fetch,
    });
    await expect(client2.images.get('x')).rejects.toBeInstanceOf(RateLimitError);

    const bad = vi.fn(async () =>
      jsonResponse({ code: 'TOOL_INVALID', message: 'bad' }, 400),
    );
    const client3 = new Imazeo({
      apiKey: 'k',
      projectId: 'p',
      baseUrl: 'https://api.example.com',
      fetch: bad as unknown as typeof fetch,
    });
    await expect(
      client3.qr.generate({ content: 'hi' }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('returns binary results for QR generation', async () => {
    const png = new Uint8Array([137, 80, 78, 71]);
    const fetchMock = vi.fn(
      async () =>
        new Response(png, {
          status: 200,
          headers: {
            'content-type': 'image/png',
            'x-request-id': 'req_bin',
          },
        }),
    );
    const client = new Imazeo({
      apiKey: 'k',
      projectId: 'p',
      baseUrl: 'https://api.example.com',
      fetch: fetchMock as unknown as typeof fetch,
    });
    const result = await client.qr.generate({ content: 'https://imazeo.com' });
    expect(result.contentType).toBe('image/png');
    expect(result.data).toEqual(png);
    expect(result.requestId).toBe('req_bin');
  });

  it('passes image list q filter', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toContain('q=photo');
      return jsonResponse([], 200);
    });
    const client = new Imazeo({
      apiKey: 'k',
      projectId: 'p',
      baseUrl: 'https://api.example.com',
      fetch: fetchMock as unknown as typeof fetch,
    });
    await client.images.list({ q: 'photo', page: 1 });
    expect(fetchMock).toHaveBeenCalled();
  });

  it('returns notModified on transform download 304', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(null, {
          status: 304,
          headers: {
            etag: '"abc"',
            'x-request-id': 'req_304',
          },
        }),
    );
    const client = new Imazeo({
      apiKey: 'k',
      projectId: 'p',
      baseUrl: 'https://api.example.com',
      fetch: fetchMock as unknown as typeof fetch,
    });
    const result = await client.transforms.download('tr_1', {
      ifNoneMatch: '"abc"',
    });
    expect(result.notModified).toBe(true);
    expect(result.data.byteLength).toBe(0);
    expect(result.requestId).toBe('req_304');
    expect(result.etag).toBe('"abc"');
  });

  it('posts transform JSON and returns binary', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.method).toBe('POST');
      expect(JSON.parse(String(init?.body))).toMatchObject({
        imageId: 'img',
        transform: { width: 100, format: 'webp' },
      });
      return new Response(new Uint8Array([1, 2]), {
        status: 200,
        headers: {
          'content-type': 'image/webp',
          'x-transformation-id': 'tr_1',
          'x-cache': 'MISS',
          'x-request-id': 'req_t',
        },
      });
    });
    const client = new Imazeo({
      apiKey: 'k',
      projectId: 'p',
      baseUrl: 'https://api.example.com',
      fetch: fetchMock as unknown as typeof fetch,
    });
    const out = await client.transforms.create({
      imageId: 'img',
      transform: { width: 100, format: 'webp' },
    });
    expect(out.transformationId).toBe('tr_1');
    expect(out.cache).toBe('MISS');
  });
});
