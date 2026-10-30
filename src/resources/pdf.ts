import { appendFile, prepareUpload } from '../http/multipart.js';
import type { HttpTransport, JsonSuccess } from '../http/transport.js';
import type {
  BinaryResult,
  PdfExtractOptions,
  PdfInfo,
  PdfRenderOptions,
  PdfRenderPage,
  UploadSource,
} from '../types.js';
import { PDF_TIMEOUT_MS } from '../version.js';

function isBinaryResult(
  value: BinaryResult | JsonSuccess<unknown>,
): value is BinaryResult {
  return 'data' in value && value.data instanceof Uint8Array;
}

export class PdfResource {
  constructor(
    private readonly http: HttpTransport,
    private readonly projectId: () => Promise<string>,
  ) {}

  async info(
    source: UploadSource,
    options?: { filename?: string; signal?: AbortSignal },
  ): Promise<PdfInfo> {
    const projectId = await this.projectId();
    const prepared = await prepareUpload(source, {
      filename: options?.filename ?? 'document.pdf',
      contentType: 'application/pdf',
    });
    const form = new FormData();
    appendFile(form, 'file', prepared);
    const url = this.http.path(['projects', projectId, 'tools', 'pdf', 'info']);
    const res = await this.http.requestMultipartJson<PdfInfo>(
      'POST',
      url,
      form,
      { timeoutMs: PDF_TIMEOUT_MS, signal: options?.signal },
    );
    return res.data;
  }

  async render(
    source: UploadSource,
    options: PdfRenderOptions & {
      filename?: string;
      signal?: AbortSignal;
    } = {},
  ): Promise<BinaryResult | { pages: PdfRenderPage[]; requestId: string }> {
    const projectId = await this.projectId();
    const prepared = await prepareUpload(source, {
      filename: options.filename ?? 'document.pdf',
      contentType: 'application/pdf',
    });
    const form = new FormData();
    appendFile(form, 'file', prepared);
    const q = new URLSearchParams();
    if (options.pages) q.set('pages', options.pages);
    if (options.rangeStart !== undefined)
      q.set('rangeStart', String(options.rangeStart));
    if (options.rangeEnd !== undefined)
      q.set('rangeEnd', String(options.rangeEnd));
    if (options.all !== undefined) q.set('all', String(options.all));
    if (options.format) q.set('format', options.format);
    if (options.scale !== undefined) q.set('scale', String(options.scale));
    if (options.quality !== undefined)
      q.set('quality', String(options.quality));
    const qs = q.toString();
    const url =
      this.http.path(['projects', projectId, 'tools', 'pdf', 'render']) +
      (qs ? `?${qs}` : '');
    const result = await this.http.requestMultipartBinary('POST', url, form, {
      timeoutMs: PDF_TIMEOUT_MS,
      signal: options.signal,
    });
    if (isBinaryResult(result)) return result;
    const pages = (result.data as { pages?: PdfRenderPage[] }).pages ?? [];
    return { pages, requestId: result.meta.requestId };
  }

  async merge(
    sources: UploadSource[],
    options?: { signal?: AbortSignal },
  ): Promise<BinaryResult> {
    if (sources.length === 0) throw new Error('At least one PDF is required');
    const projectId = await this.projectId();
    const form = new FormData();
    for (let i = 0; i < sources.length; i++) {
      const prepared = await prepareUpload(sources[i]!, {
        filename: `file-${i + 1}.pdf`,
        contentType: 'application/pdf',
      });
      appendFile(form, 'file', prepared);
    }
    const url = this.http.path([
      'projects',
      projectId,
      'tools',
      'pdf',
      'merge',
    ]);
    const result = await this.http.requestMultipartBinary('POST', url, form, {
      timeoutMs: PDF_TIMEOUT_MS,
      signal: options?.signal,
    });
    if (!isBinaryResult(result))
      throw new Error('Expected PDF binary response from merge');
    return result;
  }

  async extract(
    source: UploadSource,
    options: PdfExtractOptions & {
      filename?: string;
      signal?: AbortSignal;
    },
  ): Promise<BinaryResult> {
    const projectId = await this.projectId();
    const prepared = await prepareUpload(source, {
      filename: options.filename ?? 'document.pdf',
      contentType: 'application/pdf',
    });
    const form = new FormData();
    appendFile(form, 'file', prepared);
    const q = new URLSearchParams();
    if (options.pages) q.set('pages', options.pages);
    if (options.rangeStart !== undefined)
      q.set('rangeStart', String(options.rangeStart));
    if (options.rangeEnd !== undefined)
      q.set('rangeEnd', String(options.rangeEnd));
    const qs = q.toString();
    const url =
      this.http.path(['projects', projectId, 'tools', 'pdf', 'extract']) +
      (qs ? `?${qs}` : '');
    const result = await this.http.requestMultipartBinary('POST', url, form, {
      timeoutMs: PDF_TIMEOUT_MS,
      signal: options.signal,
    });
    if (!isBinaryResult(result))
      throw new Error('Expected PDF binary response from extract');
    return result;
  }
}
