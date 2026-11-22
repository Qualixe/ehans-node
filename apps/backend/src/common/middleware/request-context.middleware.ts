import { randomUUID } from 'node:crypto';
import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import { REQUEST_ID_HEADER } from '@ehans/shared';
import type { NextFunction, Request, Response } from 'express';

const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{8,128}$/;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Express's documented augmentation point
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Assigns a request id (reusing a well-formed incoming `x-request-id`, e.g. from Nginx),
 * echoes it in the response, and writes one structured access-log line per request.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.header(REQUEST_ID_HEADER);
    const requestId = incoming && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
    req.requestId = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);

    const startedAt = process.hrtime.bigint();
    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
      const entry = {
        requestId,
        method: req.method,
        path: req.originalUrl.split('?')[0],
        statusCode: res.statusCode,
        durationMs: Math.round(durationMs * 10) / 10,
        ip: req.ip,
      };
      if (res.statusCode >= 500) this.logger.error('request completed', entry);
      else if (res.statusCode >= 400) this.logger.warn('request completed', entry);
      else this.logger.log('request completed', entry);
    });

    next();
  }
}
