import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { API_PREFIX, REQUEST_ID_HEADER } from '@ehans/shared';
import helmet from 'helmet';
import type { Env } from '../config/env.schema.js';

export const SWAGGER_PATH = 'api/docs';

/**
 * HTTP-level setup shared by main.ts and the e2e tests so tests exercise the
 * same pipeline as production.
 */
export function configureApp(app: NestExpressApplication, env: Env): void {
  // Behind Nginx: trust exactly TRUST_PROXY hops so req.ip / req.protocol reflect the
  // real client and HTTPS (required for Secure cookies). Never `true` (spoofable).
  app.set('trust proxy', env.TRUST_PROXY);
  app.disable('x-powered-by');

  app.use(
    helmet({
      // Swagger UI needs inline styles and data: images; the API itself serves JSON only.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          frameAncestors: ["'none'"],
        },
      },
      // HSTS is set by Nginx at the TLS edge.
      strictTransportSecurity: false,
    }),
  );

  app.enableCors({
    origin: (origin, callback) => {
      // Requests without Origin (curl, server-to-server, health checks) are not CORS requests.
      if (!origin || env.CORS_ORIGINS.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', REQUEST_ID_HEADER],
    exposedHeaders: [REQUEST_ID_HEADER],
    maxAge: 600,
  });

  app.setGlobalPrefix(API_PREFIX);

  if (env.SWAGGER_ENABLED) {
    const config = new DocumentBuilder()
      .setTitle('eHans API')
      .setDescription('eCommerce backend API')
      .setVersion(env.APP_VERSION)
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(SWAGGER_PATH, app, document, { jsonDocumentUrl: `${SWAGGER_PATH}-json` });
  }
}
