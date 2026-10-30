import type { HttpTransport } from '../http/transport.js';
import type { BarcodeGenerateInput, BinaryResult } from '../types.js';
import { LIGHT_TIMEOUT_MS } from '../version.js';

export class BarcodesResource {
  constructor(
    private readonly http: HttpTransport,
    private readonly projectId: () => Promise<string>,
  ) {}

  async generate(
    input: BarcodeGenerateInput,
    signal?: AbortSignal,
  ): Promise<BinaryResult> {
    const projectId = await this.projectId();
    const url = this.http.path(['projects', projectId, 'tools', 'barcode']);
    return this.http.requestBinary('POST', url, {
      headers: { 'Content-Type': 'application/json', Accept: '*/*' },
      body: JSON.stringify(input),
      timeoutMs: LIGHT_TIMEOUT_MS,
      signal,
    });
  }
}
