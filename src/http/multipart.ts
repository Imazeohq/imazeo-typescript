import type { UploadSource } from '../types.js';

export type PreparedUpload = {
  bytes: Uint8Array;
  filename: string;
  contentType: string;
  byteLength: number;
};

export async function prepareUpload(
  source: UploadSource,
  defaults?: { filename?: string; contentType?: string },
): Promise<PreparedUpload> {
  if (source instanceof Uint8Array) {
    return {
      bytes: source,
      filename: defaults?.filename ?? 'file.bin',
      contentType: defaults?.contentType ?? 'application/octet-stream',
      byteLength: source.byteLength,
    };
  }
  if (source instanceof ArrayBuffer) {
    const bytes = new Uint8Array(source);
    return {
      bytes,
      filename: defaults?.filename ?? 'file.bin',
      contentType: defaults?.contentType ?? 'application/octet-stream',
      byteLength: bytes.byteLength,
    };
  }
  if (typeof Blob !== 'undefined' && source instanceof Blob) {
    const buf = new Uint8Array(await source.arrayBuffer());
    return {
      bytes: buf,
      filename: defaults?.filename ?? 'file.bin',
      contentType:
        defaults?.contentType ?? (source.type || 'application/octet-stream'),
      byteLength: buf.byteLength,
    };
  }
  if (
    source &&
    typeof source === 'object' &&
    'data' in source &&
    source.data instanceof Uint8Array
  ) {
    return {
      bytes: source.data,
      filename: source.filename ?? defaults?.filename ?? 'file.bin',
      contentType:
        source.contentType ?? defaults?.contentType ?? 'application/octet-stream',
      byteLength: source.data.byteLength,
    };
  }
  throw new Error('Unsupported upload source');
}

export function toBlobPart(bytes: Uint8Array): BlobPart {
  // Copy into a standalone ArrayBuffer so BlobPart typing stays clean under exactOptionalPropertyTypes.
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy;
}

export function appendFile(
  form: FormData,
  field: string,
  prepared: PreparedUpload,
): void {
  const blob = new Blob([toBlobPart(prepared.bytes)], {
    type: prepared.contentType,
  });
  form.append(field, blob, prepared.filename);
}
