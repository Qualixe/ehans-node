import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ApiErrorResponse } from '@ehans/shared';
import type { Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';

/** Maps well-known Prisma errors to HTTP semantics instead of leaking them as 500s. */
const PRISMA_ERROR_STATUS: Record<string, HttpStatus> = {
  P2002: HttpStatus.CONFLICT, // unique constraint violation
  P2003: HttpStatus.CONFLICT, // foreign key constraint violation
  P2025: HttpStatus.NOT_FOUND, // record not found
};

type ResolvedError = Pick<ApiErrorResponse, 'statusCode' | 'error' | 'message'>;

/**
 * Centralized exception handling. Every error leaves the API in the shared
 * ApiErrorResponse shape; unexpected errors are logged with their stack and
 * returned as a generic 500 so internals are never exposed to clients.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const { statusCode, error, message } = this.resolve(exception);

    const body: ApiErrorResponse = {
      statusCode,
      error,
      message,
      path: req.originalUrl.split('?')[0] ?? req.url,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    };

    if (statusCode >= 500) {
      this.logger.error(
        'unhandled exception',
        {
          requestId: req.requestId,
          method: req.method,
          path: body.path,
          error: exception instanceof Error ? exception.message : String(exception),
        },
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    if (res.headersSent) return;
    res.status(statusCode).json(body);
  }

  private resolve(exception: unknown): ResolvedError {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return { statusCode, error: exception.name, message: response };
      }
      const r = response as { message?: string | string[]; error?: string };
      return {
        statusCode,
        error: r.error ?? exception.name,
        message: r.message ?? exception.message,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const statusCode = PRISMA_ERROR_STATUS[exception.code];
      if (statusCode) {
        return {
          statusCode,
          error: statusCode === HttpStatus.NOT_FOUND ? 'Not Found' : 'Conflict',
          message:
            statusCode === HttpStatus.NOT_FOUND
              ? 'Resource not found'
              : 'Request conflicts with existing data',
        };
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    };
  }
}
