import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp, GLOBAL_PREFIX } from './app.setup';

async function bootstrap(): Promise<void> {
  // abortOnError: false lets the error reach this handler for a clear message.
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  configureApp(app);

  const port = app.get(ConfigService).get<number>('PORT', 3000);
  await app.listen(port);
  Logger.log(`API available at http://localhost:${port}/${GLOBAL_PREFIX}`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  Logger.error(`Startup failed: ${message}`, 'Bootstrap');
  process.exit(1);
});
