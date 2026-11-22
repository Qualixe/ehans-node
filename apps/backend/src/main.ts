import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { API_PREFIX } from '@ehans/shared';
import { configureApp, SWAGGER_PATH } from './bootstrap/configure-app.js';
import { type Env, validateEnv } from './config/env.schema.js';
import { loadLocalEnvFile } from './config/load-env-file.js';
import { createLogger } from './common/logging/create-logger.js';

async function bootstrap(): Promise<void> {
  loadLocalEnvFile();

  // Fail fast: validate configuration before creating the app or opening connections.
  let env: Env;
  try {
    env = validateEnv(process.env);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }

  // Imported dynamically on purpose: static ESM imports are evaluated before this
  // function runs, and AppModule's ConfigModule.forRoot() validates process.env at
  // import time, so it must load only after the .env file has been read.
  const { AppModule } = await import('./app.module.js');

  const logger = createLogger(env);
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger,
    bufferLogs: true,
  });

  configureApp(app, env);
  // Runs onModuleDestroy hooks (e.g. Prisma disconnect) on SIGTERM from `docker stop`.
  app.enableShutdownHooks();

  await app.listen(env.PORT, env.HOST);

  const base = `http://${env.HOST}:${env.PORT}`;
  logger.log(`API listening on ${base}/${API_PREFIX}`, 'Bootstrap');
  if (env.SWAGGER_ENABLED) logger.log(`Swagger UI at ${base}/${SWAGGER_PATH}`, 'Bootstrap');
}

await bootstrap();
