import type { ApiVersion } from './version.js';

export type ImazeoOptions = {
  /** Secret project API key. Sent as `X-API-Key`. Server-side only. */
  apiKey: string;
  /**
   * Project id used in `/v1/projects/:projectId/...` paths.
   * If omitted, resolved once via `GET /v1/api-key/context`.
   */
  projectId?: string;
  /** API origin only (no `/v1` suffix). Default: https://api.imazeo.com */
  baseUrl?: string;
  /** Allowlisted API version. Default: v1 */
  apiVersion?: ApiVersion;
  /** Default request timeout in ms. Default: 60000 */
  timeoutMs?: number;
  /** Optional app name appended to User-Agent */
  appName?: string;
  /** Override fetch (tests / custom agents). Defaults to global fetch. */
  fetch?: typeof fetch;
};

export type PageParams = {
  page?: number;
  limit?: number;
  /** Filename / display-name prefix filter where the resource supports it. */
  q?: string;
};

export type Page<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
  requestId: string;
};

export type BinaryResult = {
  data: Uint8Array;
  contentType: string;
  requestId: string;
  headers: Record<string, string>;
  etag?: string;
  width?: number;
  height?: number;
  format?: string;
  transformationId?: string;
  cache?: string;
  pdfPage?: number;
  /** True when the server returned HTTP 304 for an If-None-Match request. */
  notModified?: boolean;
};

export type ImageMetadata = {
  format: string;
  mimeType: string;
  width: number;
  height: number;
  frames: number;
  pixelCount: number;
  hasAlpha: boolean;
  orientation: number | null;
};

export type ImageRecord = {
  _id: string;
  projectId: string;
  sourceType: 'upload';
  originalName: string;
  bytes: number;
  sha256: string;
  metadata: ImageMetadata;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type TransformSpec = {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'inside' | 'fill';
  crop?: { left: number; top: number; width: number; height: number };
  format?: 'jpeg' | 'png' | 'webp' | 'avif' | 'gif';
  quality?: number;
  rotate?: -360 | -270 | -180 | -90 | 0 | 90 | 180 | 270 | 360;
  flip?: boolean;
  flop?: boolean;
  optimize?: boolean;
  stripMetadata?: true;
  grayscale?: boolean;
  negate?: boolean;
  blur?: number;
  sharpen?: number;
  brightness?: number;
  saturation?: number;
  hue?: number;
  trim?: true | { threshold: number };
  extend?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  background?: string;
  position?: 'center' | 'entropy' | 'attention';
};

export type TransformMode = 'PERSIST' | 'CACHE' | 'EPHEMERAL';

/** Normalized response options differ from optional request options. */
export type NormalizedTransformSpec = Omit<
  Required<TransformSpec>,
  | 'width'
  | 'height'
  | 'crop'
  | 'blur'
  | 'sharpen'
  | 'brightness'
  | 'saturation'
  | 'hue'
  | 'trim'
  | 'extend'
  | 'rotate'
> & {
  width: number | null;
  height: number | null;
  crop: NonNullable<TransformSpec['crop']> | null;
  blur: number | null;
  sharpen: number | null;
  brightness: number | null;
  saturation: number | null;
  hue: number | null;
  trim: { threshold: number } | null;
  extend: NonNullable<TransformSpec['extend']> | null;
  rotate: 0 | 90 | 180 | 270;
};

export type TransformRequest = (
  { imageId: string; url?: never } | { url: string; imageId?: never }
) & {
  mode?: TransformMode;
  maxOutputBytes?: number;
  transform?: TransformSpec;
};

export type TransformationRecord = {
  _id: string;
  projectId: string;
  imageId: string | null;
  sourceHash: string;
  transformHash: string;
  spec: NormalizedTransformSpec;
  mode: TransformMode;
  bytes: number;
  processingMs: number;
  status: string;
  sha256: string;
  metadata: ImageMetadata;
  expiresAt: string | null;
  createdAt: string;
};

export type ApiKeyContext = {
  projectId: string;
  keyId: string;
};

export type QrGenerateInput = {
  content: string;
  format?: 'png' | 'svg';
  size?: number;
  margin?: number;
  errorCorrection?: 'L' | 'M' | 'Q' | 'H';
  foreground?: string;
  background?: string;
};

export type BarcodeType =
  'code128' | 'code39' | 'ean13' | 'ean8' | 'upca' | 'itf14';

export type BarcodeGenerateInput = {
  type: BarcodeType;
  content: string;
  format?: 'png' | 'svg';
  scale?: number;
  height?: number;
  includeText?: boolean;
  foreground?: string;
  background?: string;
};

export type PdfInfo = {
  pageCount: number;
  encrypted: boolean;
  pages: Array<{ pageNumber: number; width: number; height: number }>;
};

export type PdfRenderOptions = {
  pages?: string;
  rangeStart?: number;
  rangeEnd?: number;
  all?: boolean;
  format?: 'png' | 'jpeg' | 'webp';
  scale?: number;
  quality?: number;
};

export type PdfRenderPage = {
  pageNumber: number;
  width: number;
  height: number;
  contentType: string;
  data: string;
};

export type PdfExtractOptions = {
  pages?: string;
  rangeStart?: number;
  rangeEnd?: number;
};

/** Local file input for multipart uploads (never sent as a path string). */
export type UploadSource =
  | Uint8Array
  | ArrayBuffer
  | Blob
  | { data: Uint8Array; filename?: string; contentType?: string };
