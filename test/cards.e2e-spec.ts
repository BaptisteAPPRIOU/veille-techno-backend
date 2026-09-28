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

const createList = async (token: string): Promise<string> => {
  const res = await request(app.getHttpServer())
    .post('/api/lists')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'My list' })
    .expect(201);
  return res.body.id;
};

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
    listIds[key] = await createList(tokens[key]);
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

const getCard = (id: string, token?: string) => {
  const req = request(app.getHttpServer()).get(`/api/cards/${id}`);
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
};

const patchCard = (id: string, token: string | undefined, body: object) => {
  const req = request(app.getHttpServer()).patch(`/api/cards/${id}`).send(body);
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

describe('GET /api/cards/{id} (ticket #13)', () => {
  it('returns 200 with the card when its list is mine', async () => {
    const created = await postCard(listIds.alice, tokens.alice, { title: 'Mine', position: 1 }).expect(201);
    const res = await getCard(created.body.id, tokens.alice).expect(200);
    expect(res.body).toEqual(created.body);
  });

  it('returns 403 when the parent list belongs to another user', async () => {
    const created = await postCard(listIds.bob, tokens.bob, { title: 'His' }).expect(201);
    const res = await getCard(created.body.id, tokens.alice).expect(403);
    expect(res.body).toMatchObject({ statusCode: 403, error: 'Forbidden' });
  });

  it('returns 404 for an unknown card id', async () => {
    await getCard('00000000-0000-7000-8000-000000000000', tokens.alice).expect(404);
  });

  it('returns 401 without a token', async () => {
    const created = await postCard(listIds.alice, tokens.alice, { title: 'Mine' }).expect(201);
    await getCard(created.body.id).expect(401);
  });
});

describe('PATCH /api/cards/{id} (ticket #14)', () => {
  it('returns 200 with the updated card when its list is mine', async () => {
    const created = await postCard(listIds.alice, tokens.alice, { title: 'Draft', description: 'v1' }).expect(
      201,
    );
    const changes = { title: 'Final', description: 'v2', position: 3 };
    const res = await patchCard(created.body.id, tokens.alice, changes).expect(200);
    expect(res.body).toMatchObject({ id: created.body.id, ...changes, listId: listIds.alice });

    const cleared = await patchCard(created.body.id, tokens.alice, { description: null }).expect(200);
    expect(cleared.body.description).toBeNull();
  });

  it('returns 200 and moves the card to another list of mine', async () => {
    const created = await postCard(listIds.alice, tokens.alice, { title: 'Movable' }).expect(201);
    const targetListId = await createList(tokens.alice);

    const res = await patchCard(created.body.id, tokens.alice, { listId: targetListId }).expect(200);
    expect(res.body).toMatchObject({ id: created.body.id, listId: targetListId });
    const target = await getCards(targetListId, tokens.alice).expect(200);
    expect(target.body).toHaveLength(1);
  });

  it('returns 403 when the parent list of the card belongs to another user', async () => {
    const created = await postCard(listIds.bob, tokens.bob, { title: 'His' }).expect(201);
    await patchCard(created.body.id, tokens.alice, { title: 'Hacked' }).expect(403);
  });

  it('returns 403 when moving my card to a list of another user', async () => {
    const created = await postCard(listIds.alice, tokens.alice, { title: 'Mine' }).expect(201);
    const res = await patchCard(created.body.id, tokens.alice, { listId: listIds.bob }).expect(403);
    expect(res.body).toMatchObject({ statusCode: 403, error: 'Forbidden' });
  });

  it('returns 404 for an unknown card id', async () => {
    await patchCard('00000000-0000-7000-8000-000000000000', tokens.alice, { title: 'Nobody' }).expect(404);
  });

  it('returns 404 for an unknown target list id', async () => {
    const created = await postCard(listIds.alice, tokens.alice, { title: 'Mine' }).expect(201);
    await patchCard(created.body.id, tokens.alice, { listId: '00000000-0000-7000-8000-000000000000' }).expect(
      404,
    );
  });

  it('returns 400 naming the field for an invalid payload', async () => {
    const created = await postCard(listIds.alice, tokens.alice, { title: 'Mine' }).expect(201);
    for (const body of [{ title: '' }, { position: 'top' }, { listId: null }]) {
      const res = await patchCard(created.body.id, tokens.alice, body).expect(400);
      expect(res.body.message).toContainEqual(expect.stringContaining(Object.keys(body)[0]));
    }
  });
});
