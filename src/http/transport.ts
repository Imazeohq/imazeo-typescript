import {
  NetworkError,
  mapHttpError,
  type ImazeoError,
} from '../errors.js';
import type { BinaryResult } from '../types.js';
import {
  DEFAULT_API_VERSION,
  DEFAULT_BASE_URL,
  DEFAULT_TIMEOUT_MS,
  SDK_VERSION,
  SUPPORTED_API_VERSIONS,
  type ApiVersion,
} from '../version.js';

export type TransportConfig = {
  apiKey: string;
  baseUrl: string;
  apiVersion: ApiVersion;
  timeoutMs: number;
  userAgent: string;
  fetch: typeof fetch;
};

export type JsonSuccess<T> = {
  data: T;
  meta: {
    requestId: string;
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
};

function assertApiVersion(value: string): ApiVersion {
  if ((SUPPORTED_API_VERSIONS as readonly string[]).includes(value))
    return value as ApiVersion;
  throw new Error(
    `Unsupported apiVersion "${value}". Supported: ${SUPPORTED_API_VERSIONS.join(', ')}`,
  );
}

export function normalizeBaseUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`Invalid baseUrl: ${raw}`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:')
    throw new Error('baseUrl must use http or https');
  if (url.username || url.password)
    throw new Error('baseUrl must not include credentials');
  // Strip trailing slash and accidental /v1 suffix so apiVersion stays central.
  let path = url.pathname.replace(/\/+$/, '');
  if (path === '/v1') path = '';
  url.pathname = path || '/';
  url.search = '';
  url.hash = '';
  const originAndPath =
    path && path !== '/'
      ? `${url.origin}${path}`
      : url.origin;
  return originAndPath.replace(/\/+$/, '');
}

export function createTransportConfig(input: {
  apiKey: string;
  baseUrl?: string;
  apiVersion?: string;
  timeoutMs?: number;
  appName?: string;
  fetch?: typeof fetch;
}): TransportConfig {
  const apiKey = input.apiKey?.trim();
  if (!apiKey) throw new Error('apiKey is required');
  if (apiKey.length > 128) throw new Error('apiKey is too long');
  const apiVersion = assertApiVersion(input.apiVersion ?? DEFAULT_API_VERSION);
  const baseUrl = normalizeBaseUrl(input.baseUrl ?? DEFAULT_BASE_URL);
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1)
    throw new Error('timeoutMs must be a positive number');
  const ua = input.appName
    ? `Imazeo-TypeScript/${SDK_VERSION} ${input.appName}`
    : `Imazeo-TypeScript/${SDK_VERSION}`;
  return {
    apiKey,
    baseUrl,
    apiVersion,
    timeoutMs,
    userAgent: ua.slice(0, 256),
    fetch: input.fetch ?? globalThis.fetch.bind(globalThis),
  };
}

export class HttpTransport {
  constructor(readonly config: TransportConfig) {}

  path(segments: string[]): string {
    const joined = segments
      .map((s) => encodeURIComponent(s).replace(/%2F/g, '/'))
      .join('/');
    return `${this.config.baseUrl}/${this.config.apiVersion}/${joined}`;
  }

  async requestJson<T>(
    method: string,
    url: string,
    init: {
      body?: unknown;
      headers?: Record<string, string>;
      timeoutMs?: number;
      signal?: AbortSignal;
    } = {},
  ): Promise<JsonSuccess<T>> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-API-Key': this.config.apiKey,
      'User-Agent': this.config.userAgent,
      ...init.headers,
    };
    let body: string | undefined;
    if (init.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(init.body);
    }
    const response = await this.send(url, {
      method,
      headers,
      body,
      timeoutMs: init.timeoutMs,
      signal: init.signal,
    });
    return this.parseJsonEnvelope<T>(response);
  }

  async requestBinary(
    method: string,
    url: string,
    init: {
      body?: BodyInit | null;
      headers?: Record<string, string>;
      timeoutMs?: number;
      signal?: AbortSignal;
    } = {},
  ): Promise<BinaryResult> {
    const headers: Record<string, string> = {
      Accept: '*/*',
      'X-API-Key': this.config.apiKey,
      'User-Agent': this.config.userAgent,
      ...init.headers,
    };
    const response = await this.send(url, {
      method,
      headers,
      body: init.body ?? null,
      timeoutMs: init.timeoutMs,
      signal: init.signal,
    });
    if (response.status === 304) {
      const headerMap = headerRecord(response.headers);
      return {
        data: new Uint8Array(0),
        contentType:
          response.headers.get('content-type') ?? 'application/octet-stream',
        requestId: response.headers.get('x-request-id') ?? '',
        headers: headerMap,
        etag: response.headers.get('etag') ?? headers['If-None-Match'],
        width: numHeader(response.headers, 'x-image-width'),
        height: numHeader(response.headers, 'x-image-height'),
        format: response.headers.get('x-image-format') ?? undefined,
        transformationId:
          response.headers.get('x-transformation-id') ?? undefined,
        cache: response.headers.get('x-cache') ?? undefined,
        pdfPage: numHeader(response.headers, 'x-pdf-page'),
        notModified: true,
      };
    }
    if (!response.ok) throw await this.errorFromResponse(response);
    const buf = new Uint8Array(await response.arrayBuffer());
    const headerMap = headerRecord(response.headers);
    return {
      data: buf,
      contentType: response.headers.get('content-type') ?? 'application/octet-stream',
      requestId: response.headers.get('x-request-id') ?? '',
      headers: headerMap,
      etag: response.headers.get('etag') ?? undefined,
      width: numHeader(response.headers, 'x-image-width'),
      height: numHeader(response.headers, 'x-image-height'),
      format: response.headers.get('x-image-format') ?? undefined,
      transformationId: response.headers.get('x-transformation-id') ?? undefined,
      cache: response.headers.get('x-cache') ?? undefined,
      pdfPage: numHeader(response.headers, 'x-pdf-page'),
    };
  }

  async requestMultipartJson<T>(
    method: string,
    url: string,
    form: FormData,
    init: {
      uploadLength?: number;
      timeoutMs?: number;
      signal?: AbortSignal;
      headers?: Record<string, string>;
    } = {},
  ): Promise<JsonSuccess<T>> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-API-Key': this.config.apiKey,
      'User-Agent': this.config.userAgent,
      ...init.headers,
    };
    if (init.uploadLength !== undefined)
      headers['X-Upload-Length'] = String(init.uploadLength);
    const response = await this.send(url, {
      method,
      headers,
      body: form,
      timeoutMs: init.timeoutMs,
      signal: init.signal,
    });
    return this.parseJsonEnvelope<T>(response);
  }

  async requestMultipartBinary(
    method: string,
    url: string,
    form: FormData,
    init: {
      uploadLength?: number;
      timeoutMs?: number;
      signal?: AbortSignal;
      headers?: Record<string, string>;
    } = {},
  ): Promise<BinaryResult | JsonSuccess<unknown>> {
    const headers: Record<string, string> = {
      Accept: '*/*',
      'X-API-Key': this.config.apiKey,
      'User-Agent': this.config.userAgent,
      ...init.headers,
    };
    if (init.uploadLength !== undefined)
      headers['X-Upload-Length'] = String(init.uploadLength);
    const response = await this.send(url, {
      method,
      headers,
      body: form,
      timeoutMs: init.timeoutMs,
      signal: init.signal,
    });
    if (!response.ok) throw await this.errorFromResponse(response);
    const ct = response.headers.get('content-type') ?? '';
    if (ct.includes('application/json'))
      return this.parseJsonEnvelope(response);
    const buf = new Uint8Array(await response.arrayBuffer());
    return {
      data: buf,
      contentType: ct || 'application/octet-stream',
      requestId: response.headers.get('x-request-id') ?? '',
      headers: headerRecord(response.headers),
      etag: response.headers.get('etag') ?? undefined,
      width: numHeader(response.headers, 'x-image-width'),
      height: numHeader(response.headers, 'x-image-height'),
      format: response.headers.get('x-image-format') ?? undefined,
      pdfPage: numHeader(response.headers, 'x-pdf-page'),
    };
  }

  private async send(
    url: string,
    init: {
      method: string;
      headers: Record<string, string>;
      body?: BodyInit | null;
      timeoutMs?: number;
      signal?: AbortSignal;
    },
  ): Promise<Response> {
    const timeoutMs = init.timeoutMs ?? this.config.timeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = () => controller.abort();
    if (init.signal) {
      if (init.signal.aborted) controller.abort();
      else init.signal.addEventListener('abort', onAbort, { once: true });
    }
    try {
      return await this.config.fetch(url, {
        method: init.method,
        headers: init.headers,
        body: init.body,
        redirect: 'error',
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new NetworkError({
          message: `Request timed out after ${timeoutMs}ms`,
          cause: error,
        });
      }
      throw new NetworkError({
        message: error instanceof Error ? error.message : 'Network request failed',
        cause: error,
      });
    } finally {
      clearTimeout(timer);
      if (init.signal) init.signal.removeEventListener('abort', onAbort);
    }
  }

  private async parseJsonEnvelope<T>(response: Response): Promise<JsonSuccess<T>> {
    const requestId = response.headers.get('x-request-id') ?? undefined;
    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      if (!response.ok) {
        throw mapHttpError({
          status: response.status,
          message: response.statusText || 'Request failed',
          requestId,
        });
      }
      throw new NetworkError({
        message: 'Response was not valid JSON',
        requestId,
        cause: error,
      });
    }
    if (!response.ok) throw this.errorFromPayload(response.status, payload, requestId);
    if (
      !payload ||
      typeof payload !== 'object' ||
      (payload as { success?: unknown }).success !== true ||
      !('data' in (payload as object))
    ) {
      throw mapHttpError({
        status: response.status,
        message: 'Unexpected success envelope',
        requestId,
      });
    }
    const body = payload as {
      data: T;
      meta?: {
        requestId?: string;
        page?: number;
        limit?: number;
        total?: number;
        pages?: number;
      };
    };
    return {
      data: body.data,
      meta: {
        requestId: body.meta?.requestId ?? requestId ?? '',
        page: body.meta?.page,
        limit: body.meta?.limit,
        total: body.meta?.total,
        pages: body.meta?.pages,
      },
    };
  }

  private async errorFromResponse(response: Response): Promise<ImazeoError> {
    const requestId = response.headers.get('x-request-id') ?? undefined;
    try {
      const payload = await response.json();
      return this.errorFromPayload(response.status, payload, requestId);
    } catch {
      return mapHttpError({
        status: response.status,
        message: response.statusText || 'Request failed',
        requestId,
      });
    }
  }

  private errorFromPayload(
    status: number,
    payload: unknown,
    requestId?: string,
  ): ImazeoError {
    const err =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      (payload as { error?: unknown }).error &&
      typeof (payload as { error: unknown }).error === 'object'
        ? (payload as {
            error: { code?: string; message?: string; details?: unknown };
            meta?: { requestId?: string };
          })
        : null;
    return mapHttpError({
      status,
      code: err?.error.code,
      message: err?.error.message ?? 'Request failed',
      requestId: err?.meta?.requestId ?? requestId,
      details: err?.error.details,
    });
  }
}

function headerRecord(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

function numHeader(headers: Headers, name: string): number | undefined {
  const raw = headers.get(name);
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}
