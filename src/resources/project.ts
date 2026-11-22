import type { HttpTransport } from '../http/transport.js';
import type { Page } from '../types.js';
import type { ProcessingOptions } from '../api-types.js';

export function processingHeaders(
  options: ProcessingOptions = {},
): Record<string, string> {
  const headers: Record<string, string> = {};
  if (options.idempotencyKey)
    headers['Idempotency-Key'] = options.idempotencyKey;
  if (options.quoteId) headers['X-Quote-ID'] = options.quoteId;
  return headers;
}
export class ProjectResource {
  constructor(
    protected readonly http: HttpTransport,
    private readonly projectId: () => Promise<string>,
  ) {}
  protected async url(parts: string[], query: object = {}): Promise<string> {
    const url = this.http.path(['projects', await this.projectId(), ...parts]);
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(query))
      if (value !== undefined && value !== null) qs.set(key, String(value));
    return url + (qs.size ? `?${qs}` : '');
  }
  protected async json<T>(
    method: string,
    parts: string[],
    body?: unknown,
    query?: object,
    headers?: Record<string, string>,
    signal?: AbortSignal,
  ): Promise<T> {
    return (
      await this.http.requestJson<T>(method, await this.url(parts, query), {
        body,
        headers,
        signal,
      })
    ).data;
  }
  protected async page<T>(parts: string[], query: object): Promise<Page<T>> {
    const result = await this.http.requestJson<T[]>(
      'GET',
      await this.url(parts, query),
    );
    return {
      items: result.data,
      page: result.meta.page ?? 1,
      limit: result.meta.limit ?? 20,
      total: result.meta.total ?? result.data.length,
      pages: result.meta.pages ?? 1,
      requestId: result.meta.requestId,
    };
  }
}
