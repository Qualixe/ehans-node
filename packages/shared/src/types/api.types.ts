/**
 * Shape of every error response produced by the backend's global exception filter.
 * Clients can rely on this contract for all non-2xx responses.
 */
export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
  requestId?: string;
}

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).statusCode === 'number' &&
    'message' in value
  );
}
