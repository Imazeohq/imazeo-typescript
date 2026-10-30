import { describe, expect, it, vi } from 'vitest';
import { Imazeo } from '../src/index.js';

describe('media contract', () => {
  it('sends canonical barcode names and preserves zero-prefixed content and false', async () => {
    const fetch = vi.fn(async (_url, options) => {
      expect(JSON.parse(options.body)).toEqual({
        type: 'ean8',
        content: '0123456',
        format: 'svg',
        includeText: false,
      });
      return new Response('<svg/>', {
        headers: { 'content-type': 'image/svg+xml' },
      });
    });
    const client = new Imazeo({
      apiKey: 'test',
      projectId: 'project',
      fetch: fetch as unknown as typeof globalThis.fetch,
    });
    expect(
      (
        await client.barcodes.generate({
          type: 'ean8',
          content: '0123456',
          format: 'svg',
          includeText: false,
        })
      ).contentType,
    ).toBe('image/svg+xml');
  });
  it('sends repeated file fields in PDF merge order', async () => {
    const fetch = vi.fn(async (_url, options) => {
      const form = options.body as FormData;
      expect([...form.keys()]).toEqual(['file', 'file']);
      expect(await (form.getAll('file')[0] as Blob).text()).toBe('first');
      expect(await (form.getAll('file')[1] as Blob).text()).toBe('second');
      return new Response('pdf', {
        headers: { 'content-type': 'application/pdf' },
      });
    });
    const client = new Imazeo({
      apiKey: 'test',
      projectId: 'project',
      fetch: fetch as unknown as typeof globalThis.fetch,
    });
    await client.pdf.merge([
      new TextEncoder().encode('first'),
      new TextEncoder().encode('second'),
    ]);
  });
});
