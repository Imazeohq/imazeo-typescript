import type {
  ConversionCapabilities,
  ConversionJob,
  ConversionEngine,
  ConversionRequestOptions,
  DocxOptions,
  XlsxOptions,
  PptxOptions,
  WebsiteOptions,
  ToolArtifact,
} from '../api-types.js';
import type { BinaryResult, UploadSource } from '../types.js';
import { appendFile, prepareUpload } from '../http/multipart.js';
import { ProjectResource, processingHeaders } from './project.js';
export class ConversionsResource extends ProjectResource {
  capabilities(): Promise<ConversionCapabilities> {
    return this.json('GET', ['conversions', 'capabilities']);
  }
  list(engine: ConversionEngine = 'docx'): Promise<ConversionJob[]> {
    return this.json('GET', ['conversions'], undefined, { engine });
  }
  get(id: string): Promise<ConversionJob> {
    return this.json('GET', ['conversions', id]);
  }
  lookup(key: string): Promise<ConversionJob> {
    return this.json('GET', ['conversions', 'lookup'], undefined, { key });
  }
  cancel(id: string): Promise<ConversionJob> {
    return this.json('POST', ['conversions', id, 'cancel']);
  }
  save(id: string): Promise<ToolArtifact> {
    return this.json('POST', ['conversions', id, 'save']);
  }
  async download(id: string): Promise<BinaryResult> {
    return this.http.requestBinary(
      'GET',
      await this.url(['conversions', id, 'download']),
    );
  }
  docx(
    source: UploadSource,
    request: ConversionRequestOptions,
    options: DocxOptions = {},
  ): Promise<ConversionJob> {
    return this.upload('docx', source, request, options);
  }
  xlsx(
    source: UploadSource,
    request: ConversionRequestOptions,
    options: XlsxOptions = {},
  ): Promise<ConversionJob> {
    return this.upload('xlsx', source, request, options);
  }
  pptx(
    source: UploadSource,
    request: ConversionRequestOptions,
    options: PptxOptions = {},
  ): Promise<ConversionJob> {
    return this.upload('pptx', source, request, options);
  }
  website(
    url: string,
    request: ConversionRequestOptions,
    options: WebsiteOptions = {},
  ): Promise<ConversionJob> {
    return this.json(
      'POST',
      ['conversions', 'website'],
      { url },
      options,
      processingHeaders(request),
      request.signal,
    );
  }
  private async upload(
    engine: 'docx' | 'xlsx' | 'pptx',
    source: UploadSource,
    request: ConversionRequestOptions,
    options: object,
  ): Promise<ConversionJob> {
    const prepared = await prepareUpload(source, {
      filename: `document.${engine}`,
    });
    const form = new FormData();
    appendFile(form, 'file', prepared);
    return (
      await this.http.requestMultipartJson<ConversionJob>(
        'POST',
        await this.url(
          engine === 'docx' ? ['conversions'] : ['conversions', engine],
          options,
        ),
        form,
        {
          headers: processingHeaders(request),
          uploadLength: prepared.byteLength,
          signal: request.signal,
        },
      )
    ).data;
  }
}
