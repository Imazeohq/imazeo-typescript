import { appendFile, prepareUpload } from '../http/multipart.js';
import type { HttpTransport } from '../http/transport.js';
import type {
  BinaryResult,
  ImageRecord,
  Page,
  PageParams,
  UploadSource,
} from '../types.js';

export class ImagesResource {
  constructor(
    private readonly http: HttpTransport,
    private readonly projectId: () => Promise<string>,
  ) {}

  async upload(
    source: UploadSource,
    options?: {
      filename?: string;
      contentType?: string;
      signal?: AbortSignal;
    },
  ): Promise<ImageRecord> {
    const projectId = await this.projectId();
    const prepared = await prepareUpload(source, {
      filename: options?.filename,
      contentType: options?.contentType,
    });
    const form = new FormData();
    appendFile(form, 'file', prepared);
    const url = this.http.path(['projects', projectId, 'images']);
    const res = await this.http.requestMultipartJson<ImageRecord>(
      'POST',
      url,
      form,
      {
        uploadLength: prepared.byteLength,
        signal: options?.signal,
      },
    );
    return res.data;
  }

  async list(
    params: PageParams = {},
    signal?: AbortSignal,
  ): Promise<Page<ImageRecord>> {
    const projectId = await this.projectId();
    const q = new URLSearchParams();
    if (params.page !== undefined) q.set('page', String(params.page));
    if (params.limit !== undefined) q.set('limit', String(params.limit));
    if (params.q !== undefined && params.q !== '') q.set('q', params.q);
    const qs = q.toString();
    const url =
      this.http.path(['projects', projectId, 'images']) +
      (qs ? `?${qs}` : '');
    const res = await this.http.requestJson<ImageRecord[]>('GET', url, {
      signal,
    });
    return {
      items: res.data,
      page: res.meta.page ?? params.page ?? 1,
      limit: res.meta.limit ?? params.limit ?? 20,
      total: res.meta.total ?? res.data.length,
      pages: res.meta.pages ?? 1,
      requestId: res.meta.requestId,
    };
  }

  async get(id: string, signal?: AbortSignal): Promise<ImageRecord> {
    const projectId = await this.projectId();
    const url = this.http.path(['projects', projectId, 'images', id]);
    const res = await this.http.requestJson<ImageRecord>('GET', url, {
      signal,
    });
    return res.data;
  }

  async delete(
    id: string,
    signal?: AbortSignal,
  ): Promise<{ message: string }> {
    const projectId = await this.projectId();
    const url = this.http.path(['projects', projectId, 'images', id]);
    const res = await this.http.requestJson<{ message: string }>(
      'DELETE',
      url,
      { signal },
    );
    return res.data;
  }

  async download(id: string, signal?: AbortSignal): Promise<BinaryResult> {
    const projectId = await this.projectId();
    const url = this.http.path(['projects', projectId, 'images', id, 'content']);
    return this.http.requestBinary('GET', url, { signal });
  }
}
