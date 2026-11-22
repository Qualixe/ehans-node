import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { HealthCheckResponse, HealthStatus } from '@ehans/shared';

export class HealthCheckDetailDto {
  @ApiProperty({ enum: ['ok', 'error'] })
  status: HealthStatus;

  @ApiPropertyOptional({ example: 2.4 })
  latencyMs?: number;

  @ApiPropertyOptional()
  message?: string;
}

export class HealthResponseDto implements HealthCheckResponse {
  @ApiProperty({ enum: ['ok', 'error'], example: 'ok' })
  status: HealthStatus;

  @ApiProperty({ example: 'ehans-api' })
  service: string;

  @ApiProperty({ example: '0.1.0' })
  version: string;

  @ApiProperty({ example: 120 })
  uptimeSeconds: number;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { $ref: '#/components/schemas/HealthCheckDetailDto' },
  })
  checks?: Record<string, HealthCheckDetailDto>;
}
