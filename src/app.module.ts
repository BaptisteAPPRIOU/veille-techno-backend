import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { validate } from './config/env.validation';
import { PrismaExceptionFilter } from './prisma/prisma-exception.filter';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Load .env and validate required variables so startup fails clearly if one is missing.
    ConfigModule.forRoot({ isGlobal: true, validate }),
    PrismaModule,
  ],
  providers: [
    // Validate DTOs on every route: report invalid fields with 400 and reject unknown fields.
    // Register here so the e2e tests use the same validation as main.ts.
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    },
    // Map known Prisma errors to 409 or 404 responses.
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
  ],
})
export class AppModule {}
