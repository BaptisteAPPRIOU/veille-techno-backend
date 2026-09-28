import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './helpers/app';
import { signUpAndLogin } from './helpers/auth';
import { resetDb } from './helpers/db';

const alice = { email: 'alice@example.com', password: 'Password123!', name: 'Alice' };
const bob = { email: 'bob@example.com', password: 'Password123!', name: 'Bob' };

let app: INestApplication;
const tokens: Record<string, string> = {};
const listIds: Record<string, string> = {};

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
});

// Alice and Bob each own one list, created through the API.
beforeEach(async () => {
  await resetDb(app);
  for (const [key, user] of [
    ['alice', alice],
    ['bob', bob],
  ] as const) {
    tokens[key] = (await signUpAndLogin(app, user)).token;
    const list = await request(app.getHttpServer())
      .post('/api/lists')
      .set('Authorization', `Bearer ${tokens[key]}`)
      .send({ title: 'My list' })
      .expect(201);
    listIds[key] = list.body.id;
  }
});

const getCards = (listId: string, token?: string) => {
  const req = request(app.getHttpServer()).get(`/api/lists/${listId}/cards`);
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
};

const postCard = (listId: string, token: string | undefined, body: object) => {
  const req = request(app.getHttpServer()).post(`/api/lists/${listId}/cards`).send(body);
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
};

describe('GET /api/lists/{listId}/cards (ticket #11)', () => {
  it('returns 200 with the cards of my list, ordered by position', async () => {
    // Seed directly in the database: this test only targets the read route.
    await app.get(PrismaService).card.createMany({
      data: [
        { title: 'Second', position: 1, listId: listIds.alice },
        { title: 'First', position: 0, listId: listIds.alice },
        { title: 'Not mine', position: 0, listId: listIds.bob },
      ],
    });

    const res = await getCards(listIds.alice, tokens.alice).expect(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toMatchObject({
      title: 'First',
      position: 0,
      listId: listIds.alice,
      description: null,
    });
    expect(res.body[1]).toMatchObject({ title: 'Second', position: 1, listId: listIds.alice });
    expect(res.body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
  });

  it('returns 403 when the list belongs to another user', async () => {
    const res = await getCards(listIds.bob, tokens.alice).expect(403);
    expect(res.body).toMatchObject({ statusCode: 403, error: 'Forbidden' });
  });

  it('returns 404 for an unknown list id', async () => {
    await getCards('00000000-0000-7000-8000-000000000000', tokens.alice).expect(404);
  });

  it('returns 401 without a token', async () => {
    await getCards(listIds.alice).expect(401);
  });
});

describe('POST /api/lists/{listId}/cards (ticket #12)', () => {
  it('returns 201 with the card created in my list', async () => {
    const full = { title: 'Write the README', description: 'Installation and usage', position: 2 };
    const res = await postCard(listIds.alice, tokens.alice, full).expect(201);
    expect(res.body).toMatchObject({ ...full, listId: listIds.alice });
    expect(res.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );

    const minimal = await postCard(listIds.alice, tokens.alice, { title: 'Only a title' }).expect(201);
    expect(minimal.body).toMatchObject({
      title: 'Only a title',
      description: null,
      position: 0,
      listId: listIds.alice,
    });
  });

  it('returns 403 when the list belongs to another user', async () => {
    const res = await postCard(listIds.bob, tokens.alice, { title: 'Intruder' }).expect(403);
    expect(res.body).toMatchObject({ statusCode: 403, error: 'Forbidden' });
  });

  it('returns 400 naming the field when the title is missing or empty', async () => {
    for (const body of [{}, { title: '' }]) {
      const res = await postCard(listIds.alice, tokens.alice, body).expect(400);
      expect(res.body.message).toContainEqual(expect.stringContaining('title'));
    }
  });

  it('returns 404 for an unknown list id', async () => {
    await postCard('00000000-0000-7000-8000-000000000000', tokens.alice, { title: 'Nowhere' }).expect(404);
  });
});
