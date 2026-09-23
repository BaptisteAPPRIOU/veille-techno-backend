import { INestApplication } from '@nestjs/common';

/** Every route is prefixed with /api (see openapi.yaml). */
export const GLOBAL_PREFIX = 'api';

/**
 * Shared application configuration, used by both `main.ts` and the e2e tests
 * so that routing is strictly identical in both contexts.
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(GLOBAL_PREFIX);
  app.enableShutdownHooks();
}
