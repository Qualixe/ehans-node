import { type ApiErrorResponse, isApiErrorResponse } from '@ehans/shared';
import { getApiBaseUrl } from './env';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorResponse | undefined,
  ) {
    const message = body
      ? Array.isArray(body.message)
        ? body.message.join(', ')
        : body.message
      : `Request failed with status ${status}`;
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Minimal typed fetch wrapper for the backend API.
 * `path` is relative to the API base URL, e.g. apiFetch('/health').
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${getApiBaseUrl().replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const res = await fetch(url, { credentials: 'include', ...init, headers });

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => undefined);
    throw new ApiError(res.status, isApiErrorResponse(body) ? body : undefined);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
