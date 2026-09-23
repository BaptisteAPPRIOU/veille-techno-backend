import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './helpers/app';
import { resetDb } from './helpers/db';

describe('Project initialization (ticket #1)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('starts and answers under the /api prefix with the standard Nest JSON error format', async () => {
    const res = await request(app.getHttpServer()).get('/api/unknown-route').expect(404);
    expect(res.body).toMatchObject({ statusCode: 404, error: 'Not Found' });
    expect(res.body.message).toContain('/api/unknown-route');
  });

  it('reaches the migrated test database (kanban_test)', async () => {
    await resetDb(app);
    const prisma = app.get(PrismaService);
    await expect(prisma.user.count()).resolves.toBe(0);
  });
});
