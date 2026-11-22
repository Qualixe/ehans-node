export type HealthStatus = 'ok' | 'error';

export interface HealthCheckResponse {
  status: HealthStatus;
  service: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
  checks?: Record<string, { status: HealthStatus; latencyMs?: number; message?: string }>;
}
