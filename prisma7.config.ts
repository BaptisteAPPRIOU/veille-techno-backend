// Prisma 7 configuration (loaded automatically by the CLI).
// Prisma does not load environment variables, so import `dotenv/config`.
// For e2e tests, dotenv-cli loads .env.test first; existing variables take precedence.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
