import {
  createTransportConfig,
  HttpTransport,
} from './http/transport.js';
import { ContextResource } from './resources/context.js';
import { ImagesResource } from './resources/images.js';
import { TransformsResource } from './resources/transforms.js';
import { QrResource } from './resources/qr.js';
import { BarcodesResource } from './resources/barcodes.js';
import { PdfResource } from './resources/pdf.js';
import type { ImazeoOptions } from './types.js';
import {
  DEFAULT_API_VERSION,
  SDK_VERSION,
  SUPPORTED_API_VERSIONS,
} from './version.js';

/**
 * Official Imazeo server-side client.
 *
 * Uses secret `X-API-Key` authentication. Do not embed API keys in browsers.
 */
export class Imazeo {
  readonly images: ImagesResource;
  readonly transforms: TransformsResource;
  readonly qr: QrResource;
  readonly barcodes: BarcodesResource;
  readonly pdf: PdfResource;
  readonly context: ContextResource;

  private readonly http: HttpTransport;
  private projectIdPromise?: Promise<string>;
  private readonly configuredProjectId?: string;

  constructor(options: ImazeoOptions) {
    this.http = new HttpTransport(
      createTransportConfig({
        apiKey: options.apiKey,
        baseUrl: options.baseUrl,
        apiVersion: options.apiVersion,
        timeoutMs: options.timeoutMs,
        appName: options.appName,
        fetch: options.fetch,
      }),
    );
    this.configuredProjectId = options.projectId?.trim() || undefined;
    const resolveProjectId = () => this.resolveProjectId();
    this.context = new ContextResource(this.http);
    this.images = new ImagesResource(this.http, resolveProjectId);
    this.transforms = new TransformsResource(this.http, resolveProjectId);
    this.qr = new QrResource(this.http, resolveProjectId);
    this.barcodes = new BarcodesResource(this.http, resolveProjectId);
    this.pdf = new PdfResource(this.http, resolveProjectId);
  }

  /** SDK package version (SemVer). */
  static get version(): string {
    return SDK_VERSION;
  }

  /** Default and supported API versions. */
  static get apiCompatibility(): {
    defaultApi: string;
    supported: readonly string[];
  } {
    return {
      defaultApi: DEFAULT_API_VERSION,
      supported: SUPPORTED_API_VERSIONS,
    };
  }

  private resolveProjectId(): Promise<string> {
    if (this.configuredProjectId) return Promise.resolve(this.configuredProjectId);
    this.projectIdPromise ??= this.context.get().then((c) => c.projectId);
    return this.projectIdPromise;
  }
}
