import type { HttpTransport } from '../http/transport.js';
import type { BinaryResult, QrGenerateInput } from '../types.js';
import { LIGHT_TIMEOUT_MS } from '../version.js';

export class QrResource {
  constructor(
    private readonly http: HttpTransport,
    private readonly projectId: () => Promise<string>,
  ) {}

  async generate(
    input: QrGenerateInput,
    signal?: AbortSignal,
  ): Promise<BinaryResult> {
    const projectId = await this.projectId();
    const url = this.http.path(['projects', projectId, 'tools', 'qr']);
    return this.http.requestBinary('POST', url, {
      headers: { 'Content-Type': 'application/json', Accept: '*/*' },
      body: JSON.stringify(input),
      timeoutMs: LIGHT_TIMEOUT_MS,
      signal,
    });
  }
}
