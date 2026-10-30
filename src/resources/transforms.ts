import type { HttpTransport } from '../http/transport.js';
import type {
  BinaryResult,
  Page,
  PageParams,
  TransformationRecord,
  TransformRequest,
} from '../types.js';

export class TransformsResource {
  constructor(
    private readonly http: HttpTransport,
    private readonly projectId: () => Promise<string>,
  ) {}

  async create(
    request: TransformRequest,
    signal?: AbortSignal,
  ): Promise<BinaryResult> {
    if (!request.imageId && !request.url)
      throw new Error('Exactly one of imageId or url is required');
    if (request.imageId && request.url)
      throw new Error('Provide only one of imageId or url');
    const projectId = await this.projectId();
    const url = this.http.path(['projects', projectId, 'transforms']);
    return this.http.requestBinary('POST', url, {
      headers: { 'Content-Type': 'application/json', Accept: '*/*' },
      body: JSON.stringify(request),
      signal,
    });
  }

  async list(
    params: PageParams = {},
    signal?: AbortSignal,
  ): Promise<Page<TransformationRecord>> {
    const projectId = await this.projectId();
    const q = new URLSearchParams();
    if (params.page !== undefined) q.set('page', String(params.page));
    if (params.limit !== undefined) q.set('limit', String(params.limit));
    const qs = q.toString();
    const url =
      this.http.path(['projects', projectId, 'transforms']) +
      (qs ? `?${qs}` : '');
    const res = await this.http.requestJson<TransformationRecord[]>(
      'GET',
      url,
      { signal },
    );
    return {
      items: res.data,
      page: res.meta.page ?? params.page ?? 1,
      limit: res.meta.limit ?? params.limit ?? 20,
      total: res.meta.total ?? res.data.length,
      pages: res.meta.pages ?? 1,
      requestId: res.meta.requestId,
    };
  }

  async get(id: string, signal?: AbortSignal): Promise<TransformationRecord> {
    const projectId = await this.projectId();
    const url = this.http.path(['projects', projectId, 'transforms', id]);
    const res = await this.http.requestJson<TransformationRecord>('GET', url, {
      signal,
    });
    return res.data;
  }

  async download(
    id: string,
    options?: { ifNoneMatch?: string; signal?: AbortSignal },
  ): Promise<BinaryResult> {
    const projectId = await this.projectId();
    const url = this.http.path([
      'projects',
      projectId,
      'transforms',
      id,
      'content',
    ]);
    const headers: Record<string, string> = {};
    if (options?.ifNoneMatch) headers['If-None-Match'] = options.ifNoneMatch;
    return this.http.requestBinary('GET', url, {
      headers,
      signal: options?.signal,
    });
  }

  async delete(
    id: string,
    signal?: AbortSignal,
  ): Promise<{ message: string }> {
    const projectId = await this.projectId();
    const url = this.http.path(['projects', projectId, 'transforms', id]);
    const res = await this.http.requestJson<{ message: string }>(
      'DELETE',
      url,
      { signal },
    );
    return res.data;
  }
}
