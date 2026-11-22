import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter.js';

function createHost() {
  const res = {
    headersSent: false,
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const req = {
    originalUrl: '/api/v1/things?x=1',
    url: '/api/v1/things?x=1',
    method: 'GET',
    requestId: 'req-12345678',
  };
  const host = {
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
  } as unknown as ArgumentsHost;
  return { host, res };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  beforeAll(() => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  it('formats HttpExceptions', () => {
    const { host, res } = createHost();
    filter.catch(new NotFoundException('Product not found'), host);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Product not found',
        path: '/api/v1/things',
        requestId: 'req-12345678',
      }),
    );
  });

  it('keeps validation messages as an array', () => {
    const { host, res } = createHost();
    filter.catch(new BadRequestException(['name must be a string']), host);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400, message: ['name must be a string'] }),
    );
  });

  it('hides internals of unexpected errors', () => {
    const { host, res } = createHost();
    filter.catch(new Error('connection string leaked: postgres://secret'), host);
    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0]?.[0] as { message: string };
    expect(body.message).toBe('An unexpected error occurred');
    expect(JSON.stringify(body)).not.toContain('secret');
  });
});
