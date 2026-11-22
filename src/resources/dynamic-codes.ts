import type {
  DynamicCapabilities,
  DynamicCode,
  DynamicCreateInput,
  DynamicEditInput,
  ScanAnalytics,
  ScanQuery,
  ListOptions,
} from '../api-types.js';
import type { Page, BinaryResult } from '../types.js';
import { ProjectResource, processingHeaders } from './project.js';
export class DynamicCodesResource extends ProjectResource {
  capabilities(): Promise<DynamicCapabilities> {
    return this.json('GET', ['dynamic-codes', 'capabilities']);
  }
  list(
    params: Pick<ListOptions, 'page' | 'limit' | 'search' | 'status'> = {},
  ): Promise<Page<DynamicCode>> {
    return this.page(['dynamic-codes'], params);
  }
  get(id: string): Promise<DynamicCode> {
    return this.json('GET', ['dynamic-codes', id]);
  }
  create(
    input: DynamicCreateInput,
    idempotencyKey: string,
  ): Promise<DynamicCode> {
    return this.json(
      'POST',
      ['dynamic-codes'],
      input,
      undefined,
      processingHeaders({ idempotencyKey }),
    );
  }
  update(
    id: string,
    input: DynamicEditInput,
    idempotencyKey: string,
  ): Promise<DynamicCode> {
    return this.json(
      'PATCH',
      ['dynamic-codes', id],
      input,
      undefined,
      processingHeaders({ idempotencyKey }),
    );
  }
  analytics(id: string, query: ScanQuery = {}): Promise<ScanAnalytics> {
    return this.json(
      'GET',
      ['dynamic-codes', id, 'analytics'],
      undefined,
      query,
    );
  }
  async exportAnalytics(
    id: string,
    query: ScanQuery = {},
  ): Promise<BinaryResult> {
    return this.http.requestBinary(
      'GET',
      await this.url(['dynamic-codes', id, 'analytics', 'export'], query),
    );
  }
}
