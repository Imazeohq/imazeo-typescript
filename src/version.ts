/** Derived from package.json at build/publish time; keep in sync with package.json version. */
export const SDK_VERSION = '1.0.0';
export const DEFAULT_API_VERSION = 'v1' as const;
export const SUPPORTED_API_VERSIONS = ['v1'] as const;
export type ApiVersion = (typeof SUPPORTED_API_VERSIONS)[number];
export const DEFAULT_BASE_URL = 'https://api.imazeo.com';
export const DEFAULT_TIMEOUT_MS = 60_000;
export const PDF_TIMEOUT_MS = 120_000;
export const LIGHT_TIMEOUT_MS = 30_000;
