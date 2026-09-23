import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Every route is prefixed with /api (see openapi.yaml). */
export const GLOBAL_PREFIX = 'api';

export const SWAGGER_PATH = 'api';

/**
 * Shared application configuration, used by both `main.ts` and the e2e tests
 * so that routing is strictly identical in both contexts.
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(GLOBAL_PREFIX);
  app.enableShutdownHooks();
}

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Kanban Board API')
    .setDescription(
      'Shared contract of the backend technology study (NestJS implementation). '
    )
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();

  SwaggerModule.setup(SWAGGER_PATH, app, () => SwaggerModule.createDocument(app, config), {
    customSiteTitle: 'Kanban Board API',
  });
}
