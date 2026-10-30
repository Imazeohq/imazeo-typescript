export type ImazeoErrorInit = {
  message: string;
  status?: number;
  code?: string;
  requestId?: string;
  details?: unknown;
  cause?: unknown;
};

export class ImazeoError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(init: ImazeoErrorInit) {
    super(init.message);
    this.name = 'ImazeoError';
    this.status = init.status;
    this.code = init.code;
    this.requestId = init.requestId;
    this.details = init.details;
    if (init.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = init.cause;
    }
  }
}

export class AuthenticationError extends ImazeoError {
  constructor(init: ImazeoErrorInit) {
    super(init);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ImazeoError {
  constructor(init: ImazeoErrorInit) {
    super(init);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends ImazeoError {
  constructor(init: ImazeoErrorInit) {
    super(init);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ImazeoError {
  constructor(init: ImazeoErrorInit) {
    super(init);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ImazeoError {
  constructor(init: ImazeoErrorInit) {
    super(init);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends ImazeoError {
  constructor(init: ImazeoErrorInit) {
    super(init);
    this.name = 'RateLimitError';
  }
}

export class ApiError extends ImazeoError {
  constructor(init: ImazeoErrorInit) {
    super(init);
    this.name = 'ApiError';
  }
}

export class NetworkError extends ImazeoError {
  constructor(init: ImazeoErrorInit) {
    super(init);
    this.name = 'NetworkError';
  }
}

export function mapHttpError(init: {
  status: number;
  code?: string;
  message: string;
  requestId?: string;
  details?: unknown;
}): ImazeoError {
  const base = {
    status: init.status,
    code: init.code,
    message: init.message,
    requestId: init.requestId,
    details: init.details,
  };
  if (init.status === 401) return new AuthenticationError(base);
  if (init.status === 403) return new AuthorizationError(base);
  if (init.status === 404) return new NotFoundError(base);
  if (init.status === 409) return new ConflictError(base);
  if (init.status === 429) return new RateLimitError(base);
  if (init.status === 400 || init.status === 413 || init.status === 415)
    return new ValidationError(base);
  return new ApiError(base);
}
