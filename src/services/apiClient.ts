import { apiBaseUrl } from '../config/environment';

export interface ValidationDetail {
  path?: Array<string | number>;
  message: string;
}

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: ValidationDetail[];
    requestId?: string;
  };
}

export interface PageMeta {
  nextCursor: string | null;
}

export interface ApiPage<T> {
  data: T[];
  meta: PageMeta;
}

export class ApiError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
    public readonly code = 'request_failed',
    public readonly details: ValidationDetail[] = [],
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiConfigurationError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'ApiConfigurationError';
  }
}

type AccessTokenProvider = () => Promise<string>;

let accessTokenProvider: AccessTokenProvider | null = null;

export function configureAccessTokenProvider(provider: AccessTokenProvider | null) {
  accessTokenProvider = provider;
}

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  auth?: boolean;
  body?: unknown;
  accessToken?: string;
}

function createErrorMessage(status: number, body: ApiErrorBody | null): string {
  if (body?.error?.details?.length) {
    return body.error.details
      .map((detail) => `${detail.path?.join('.') || 'Request'}: ${detail.message}`)
      .join(' ');
  }

  if (body?.error?.message) {
    return body.error.message;
  }

  if (status === 401) return 'Your session expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'The requested item could not be found.';
  if (status === 409) return 'That action conflicts with the current resource state.';
  return 'The CodeHawks service could not complete the request.';
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError('The server returned an invalid response.', response.status, 'invalid_response');
  }
}

export async function apiRequestEnvelope<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<{ data: T; meta?: PageMeta }> {
  if (!apiBaseUrl) {
    throw new ApiConfigurationError('VITE_API_BASE_URL is required when using the API data source.');
  }

  const { auth = false, body, accessToken, headers: suppliedHeaders, ...requestInit } = options;
  const headers = new Headers(suppliedHeaders);
  headers.set('Accept', 'application/json');

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = accessToken ?? await accessTokenProvider?.();
    if (!token) {
      throw new ApiError('Sign in with your UNG Microsoft account to continue.', 401, 'not_authenticated');
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...requestInit,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError(
      'Unable to reach the CodeHawks service. Check your connection and try again.',
      0,
      'network_error',
    );
  }

  if (response.status === 204) {
    return { data: undefined as T };
  }

  const parsed = await parseJson(response);

  if (!response.ok) {
    const errorBody = parsed && typeof parsed === 'object' ? parsed as ApiErrorBody : null;
    throw new ApiError(
      createErrorMessage(response.status, errorBody),
      response.status,
      errorBody?.error?.code,
      errorBody?.error?.details,
      errorBody?.error?.requestId,
    );
  }

  if (!parsed || typeof parsed !== 'object' || !('data' in parsed)) {
    throw new ApiError('The server response did not include data.', response.status, 'invalid_response');
  }

  const envelope = parsed as { data: T; meta?: PageMeta };
  return { data: envelope.data, ...(envelope.meta ? { meta: envelope.meta } : {}) };
}

export async function apiRequest<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return (await apiRequestEnvelope<T>(path, options)).data;
}

export async function apiRequestPage<T>(path: string, options?: ApiRequestOptions): Promise<ApiPage<T>> {
  const envelope = await apiRequestEnvelope<T[]>(path, options);
  return {
    data: envelope.data,
    meta: envelope.meta ?? { nextCursor: null },
  };
}
