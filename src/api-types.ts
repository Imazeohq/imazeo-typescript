import type {
  QrGenerateInput,
  BinaryResult,
  PdfInfo,
  PdfRenderPage,
} from './types.js';

export type CodeDesign = {
  moduleShape?: 'square' | 'rounded' | 'dots' | 'soft' | 'classy';
  finderOuter?: 'square' | 'rounded' | 'circle';
  finderInner?: 'square' | 'rounded' | 'dot';
  fill?: 'solid' | 'linear';
  textAlign?: 'left' | 'center' | 'right';
  fontFamily?: 'sans' | 'serif' | 'mono';
  fontWeight?: 'normal' | 'bold';
  barTextAlign?: 'left' | 'center' | 'right';
  barTextPosition?: 'above' | 'below';
  moduleScale?: number;
  gradientAngle?: number;
  logoScale?: number;
  logoPadding?: number;
  captionSize?: number;
  quietZone?: number;
  barTextSize?: number;
  finderColor?: string;
  finderInnerColor?: string;
  gradientColor?: string;
  frameColor?: string;
  captionColor?: string;
  headline?: string;
  subtitle?: string;
  schemaVersion: 1;
  template: 'classic' | 'rounded' | 'dots' | 'label';
  templateVersion: 1;
  frame?: 'none' | 'line' | 'rounded' | 'brackets' | 'badge';
  caption?: string;
  logoImageId?: string;
};

export type DocxOptions = {
  page?: number;
  scale?: number;
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  fitSinglePage?: boolean;
  honorWordPageBreaks?: boolean;
  renderHeaders?: boolean;
  renderFooters?: boolean;
  renderFootnotes?: boolean;
  renderEndnotes?: boolean;
  repairBrokenRelationships?: boolean;
  unwrapSdt?: boolean;
  collapseMcAlternate?: boolean;
  ignoreImageWrap?: boolean;
  ignoreTableWrap?: boolean;
  applyWordChrome?: boolean;
  normalizeTheme?: boolean;
  renderChanges?: boolean;
};

export type XlsxOptions = {
  page?: number;
  scale?: number;
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  engine?: 'xlsx';
  sheet?: number;
  renderMode?: 'sheet' | 'print';
  range?: string;
  showGridLines?: boolean;
  paperSize?:
    | 'saved'
    | 'A3'
    | 'A4'
    | 'A5'
    | 'Letter'
    | 'Legal'
    | 'Tabloid'
    | 'B5';
};

export type PptxOptions = {
  page?: number;
  scale?: number;
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  engine?: 'pptx';
};

export type WebsiteOptions = {
  page?: number;
  scale?: number;
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  engine?: 'website';
  mode?: 'viewport' | 'fullPage' | 'element' | 'clip';
  width?: number;
  height?: number;
  selector?: string;
  clipX?: number;
  clipY?: number;
  clipWidth?: number;
  clipHeight?: number;
  javascriptEnabled?: boolean;
  blockTrackers?: boolean;
  autoScroll?: boolean;
  freezeAnimations?: boolean;
  omitBackground?: boolean;
  colorScheme?: 'light' | 'dark';
  reducedMotion?: boolean;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle2';
  waitMs?: number;
};

export type ConversionCapabilities = {
  enabled: boolean;
  maxUploadBytes: number;
  maxPixels: number;
  maxOutputBytes: number;
  formats: Array<'png' | 'jpeg' | 'webp'>;
  maxPage: number;
  temporaryMinutes: number;
  engines: Array<ConversionEngineInfo>;
};

export type ConversionEngineInfo = {
  id: 'docx' | 'xlsx' | 'pptx' | 'website';
  enabled: boolean;
  label: string;
  unit: 'page' | 'sheet' | 'slide' | 'website';
  maxUnits: number;
};

export type ConversionJob = {
  id: string;
  projectId: string;
  status:
    | 'queued'
    | 'running'
    | 'cancelling'
    | 'completed'
    | 'failed'
    | 'cancelled';
  engine: 'docx' | 'xlsx' | 'pptx' | 'website';
  options: DocxOptions | XlsxOptions | PptxOptions | WebsiteOptions;
  credits: number;
  createdAt: string;
  expiresAt: string | null;
  artifactId: string | null;
  errorCode: string | null;
  result: ConversionResult | null;
};

export type ConversionResult = {
  bytes: number;
  width: number;
  height: number;
  pageCount: number;
  contentType: string;
  warnings: Array<string>;
};

export type DynamicCapabilities = {
  enabled: boolean;
  canEdit: boolean;
  analytics: boolean;
  activeCount: number;
  maxActiveCodes: number;
  retentionDays: number;
};

export type DynamicCode = {
  analyticsEnabled: boolean;
  qrOptions: QrGenerateInput | null;
  id: string;
  projectId: string;
  name: string;
  slug: string;
  redirectUrl: string;
  destination: string | null;
  status: 'active' | 'paused' | 'deleted';
  suspended: boolean;
  revision: number;
  createdAt: string;
  updatedAt: string;
  recordedScans?: number | null;
};

export type DynamicCreateInput = {
  analyticsEnabled?: boolean;
  name: string;
  destination: string;
};

export type DynamicEditInput = {
  analyticsEnabled?: boolean;
  qrOptions?: QrGenerateInput;
  expectedRevision: number;
  name?: string;
  destination?: string;
  status?: 'active' | 'paused' | 'deleted';
};

export type ScanAnalytics = {
  days: number;
  total: number;
  retentionDays: number;
  bestEffort: boolean;
  series: Array<ScanPoint>;
  devices: Array<ScanBreakdown>;
  browsers: Array<ScanBreakdown>;
  countries: Array<ScanBreakdown>;
  recent: Array<ScanRecent>;
};

export type ScanPoint = {
  date: string;
  count: number;
};

export type ScanBreakdown = {
  key: string;
  count: number;
};

export type ScanRecent = {
  id: string;
  createdAt: string;
  device: string;
  browser: string;
  bot: boolean;
  country: string;
  ip: string | null;
  forwardedFor: string | null;
  userAgent: string | null;
  acceptLanguage: string | null;
  language: string | null;
  referer: string | null;
  platform: string;
  clientHints: string | null;
  mobileHint: boolean | null;
  protocol: string;
  accept: string | null;
};

export type CreditQuote = {
  replayEnabled: boolean;
  id: string;
  kind:
    | 'code.qr'
    | 'code.barcode'
    | 'pdf.info'
    | 'pdf.render'
    | 'pdf.merge'
    | 'pdf.extract'
    | 'image.transform'
    | 'remote.fetch'
    | 'docx.render'
    | 'xlsx.render'
    | 'pptx.render'
    | 'website.capture';
  units: number;
  credits: number;
  unitCost: number;
  remoteUnitCost: number;
  scheduleId: string;
  expiresAt: string;
};

export type CreditQuoteInput = {
  kind:
    | 'code.qr'
    | 'code.barcode'
    | 'pdf.info'
    | 'pdf.render'
    | 'pdf.merge'
    | 'pdf.extract'
    | 'image.transform'
    | 'docx.render'
    | 'xlsx.render'
    | 'pptx.render'
    | 'website.capture';
  units: number;
  remote?: true | false;
};

export type ProcessingStatus = {
  id: string;
  kind:
    | 'code.qr'
    | 'code.barcode'
    | 'pdf.info'
    | 'pdf.render'
    | 'pdf.merge'
    | 'pdf.extract'
    | 'image.transform'
    | 'remote.fetch'
    | 'docx.render'
    | 'xlsx.render'
    | 'pptx.render'
    | 'website.capture';
  state: 'running' | 'completed' | 'failed';
  resultExpiresAt: string;
  hasResult: boolean;
  failureCode: string | null;
};

export type ProcessingLookupInput = {
  kind:
    | 'code.qr'
    | 'code.barcode'
    | 'pdf.info'
    | 'pdf.render'
    | 'pdf.merge'
    | 'pdf.extract'
    | 'image.transform'
    | 'remote.fetch'
    | 'docx.render'
    | 'xlsx.render'
    | 'pptx.render'
    | 'website.capture';
  key: string;
};

export type ToolArtifact = {
  _id: string;
  projectId: string;
  kind:
    | 'qr'
    | 'barcode'
    | 'pdf_render'
    | 'pdf_merge'
    | 'pdf_extract'
    | 'image_transform'
    | 'docx_render'
    | 'xlsx_render'
    | 'pptx_render'
    | 'website_capture';
  displayName: string;
  status: 'ready' | 'deleting';
  bytes: number;
  sha256: string;
  contentType: string;
  outputType: string;
  requestSnapshot: Record<string, unknown>;
  sourceImageId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OutputsSummary = {
  total: number;
  originals: number;
  transforms: number;
  images: number;
  qr: number;
  barcode: number;
  pdf: number;
  docx?: number;
  xlsx?: number;
  pptx?: number;
  website?: number;
};

export type OutputRow = {
  id: string;
  kind:
    | 'original'
    | 'transform'
    | 'image_transform'
    | 'qr'
    | 'barcode'
    | 'pdf'
    | 'docx'
    | 'xlsx'
    | 'pptx'
    | 'website';
  name: string;
  type: string;
  status: string;
  createdAt: string;
  bytes: number;
  thumbAvailable: boolean;
  sourceImageId?: string | null;
  contentType?: string | null;
  meta?: Record<string, unknown>;
};

export type ProcessingOptions = { idempotencyKey?: string; quoteId?: string };
export type ConversionRequestOptions = {
  idempotencyKey: string;
  quoteId: string;
  signal?: AbortSignal;
};
export type ConversionEngine = 'docx' | 'xlsx' | 'pptx' | 'website';
export type ListOptions = {
  page?: number;
  limit?: number;
  q?: string;
  kind?: string;
  type?: string;
  search?: string;
  status?: 'active' | 'paused' | 'deleted';
};
export type ScanQuery = {
  days?: number;
  device?: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown';
  browser?: 'chrome' | 'edge' | 'firefox' | 'safari' | 'other' | 'unknown';
  country?: string;
  bot?: boolean;
};
export type ArtifactSaveInput = {
  kind:
    | 'qr'
    | 'barcode'
    | 'pdf_render'
    | 'pdf_merge'
    | 'pdf_extract'
    | 'image_transform';
  displayName: string;
  contentType: string;
  requestSnapshot?: Record<string, unknown>;
  sourceImageId?: string;
};

export type ProcessingResult =
  | BinaryResult
  | PdfInfo
  | { pages: PdfRenderPage[] };
