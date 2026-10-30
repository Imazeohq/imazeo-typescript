import type { HttpTransport } from '../http/transport.js';
import type { ApiKeyContext } from '../types.js';
import { LIGHT_TIMEOUT_MS } from '../version.js';

export class ContextResource {
  constructor(private readonly http: HttpTransport) {}

  async get(signal?: AbortSignal): Promise<ApiKeyContext> {
    const url = this.http.path(['api-key', 'context']);
    const res = await this.http.requestJson<ApiKeyContext>('GET', url, {
      timeoutMs: LIGHT_TIMEOUT_MS,
      signal,
    });
    return res.data;
  }
}
