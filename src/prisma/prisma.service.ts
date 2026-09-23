import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Shared Prisma client (global module).
 * - The `pg` driver adapter is required by Prisma 7.
 * - The global `omit` setting keeps `password` out of query results unless
 *   explicitly overridden with `omit: { password: false }` during login.
 * - `SELECT 1` fails startup immediately if the database is unreachable.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    super({
      adapter: new PrismaPg({ connectionString: config.getOrThrow<string>('DATABASE_URL') }),
      omit: { user: { password: true } },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    // With the driver adapter, $connect() is lazy. A query exposes an unreachable
    // database or invalid credentials immediately during startup.
    await this.$queryRaw`SELECT 1`;
    this.logger.log('PostgreSQL connection established');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
