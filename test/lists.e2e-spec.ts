import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './helpers/app';
import { signUpAndLogin } from './helpers/auth';
import { resetDb } from './helpers/db';

const alice = { email: 'alice@example.com', password: 'Password123!', name: 'Alice' };
const bob = { email: 'bob@example.com', password: 'Password123!', name: 'Bob' };

let app: INestApplication;
const ids: Record<string, string> = {};
const tokens: Record<string, string> = {};

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await resetDb(app);
  for (const [key, user] of [
    ['alice', alice],
    ['bob', bob],
  ] as const) {
    const { id, token } = await signUpAndLogin(app, user);
    ids[key] = id;
    tokens[key] = token;
  }
});

const getLists = (token?: string) => {
  const req = request(app.getHttpServer()).get('/api/lists');
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
};

describe('GET /api/lists (ticket #7)', () => {
  it('returns 200 with only the lists of the current user, ordered by position', async () => {
    // Seed directly in the database: this test only targets the read route.
    await app.get(PrismaService).list.createMany({
      data: [
        { title: 'Done', position: 2, ownerId: ids.alice },
        { title: 'To do', position: 0, ownerId: ids.alice },
        { title: 'Bob only', position: 0, ownerId: ids.bob },
      ],
    });

    const res = await getLists(tokens.alice).expect(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toMatchObject({ title: 'To do', position: 0, ownerId: ids.alice });
    expect(res.body[1]).toMatchObject({ title: 'Done', position: 2, ownerId: ids.alice });
    expect(res.body[0]).toEqual(
      expect.objectContaining({ id: expect.any(String), createdAt: expect.any(String) }),
    );
  });

  it('returns 200 with an empty array when the user has no list', async () => {
    const res = await getLists(tokens.alice).expect(200);
    expect(res.body).toEqual([]);
  });

  it('returns 401 without a token', async () => {
    await getLists().expect(401);
  });
});
