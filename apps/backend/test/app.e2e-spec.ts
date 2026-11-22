import { Logger } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap/configure-app.js';
import { validateEnv } from '../src/config/env.schema.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/**
 * Exercises the real HTTP pipeline (prefix, middleware, filters, CORS, Swagger)
 * with the database replaced by a stub, so it runs without PostgreSQL.
 */
describe('App (e2e)', () => {
  let app: NestExpressApplication;
  const prismaStub = {
    ping: vi.fn().mockResolvedValue(undefined),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    onModuleInit: vi.fn(),
    onModuleDestroy: vi.fn(),
  };

  beforeAll(async () => {
    // Test env is defined in vitest.config.e2e.ts.
    const env = validateEnv(process.env);

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaStub)
      .compile();

    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    configureApp(app, env);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns liveness', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', service: 'ehans-api', version: 'e2e' });
    expect(res.headers['x-request-id']).toBeTruthy();
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('GET /api/v1/health/ready returns 200 when the DB responds', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(200);
    expect(res.body.checks.database.status).toBe('ok');
  });

  it('GET /api/v1/health/ready returns 503 when the DB is down', async () => {
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    prismaStub.ping.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(503);
    expect(res.body.status).toBe('error');
  });

  it('unknown routes return the shared error shape', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/does-not-exist')
      .set('x-request-id', 'test-request-0001')
      .expect(404);
    expect(res.body).toMatchObject({
      statusCode: 404,
      path: '/api/v1/does-not-exist',
      requestId: 'test-request-0001',
    });
  });

  it('routes outside the global prefix are not served', async () => {
    await request(app.getHttpServer()).get('/health').expect(404);
  });

  it('allows configured CORS origins only', async () => {
    const allowed = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:3000');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:3000');

    const denied = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('Origin', 'https://evil.example');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('serves the OpenAPI document', async () => {
    const res = await request(app.getHttpServer()).get('/api/docs-json').expect(200);
    expect(res.body.paths).toHaveProperty('/api/v1/health');
  });
});
