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

const postList = (token: string | undefined, body: object) => {
  const req = request(app.getHttpServer()).post('/api/lists').send(body);
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
};

const patchList = (id: string, token: string | undefined, body: object) => {
  const req = request(app.getHttpServer()).patch(`/api/lists/${id}`).send(body);
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
};

const deleteList = (id: string, token?: string) => {
  const req = request(app.getHttpServer()).delete(`/api/lists/${id}`);
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

describe('POST /api/lists (ticket #8)', () => {
  it('returns 201 with the created list owned by the current user', async () => {
    const res = await postList(tokens.alice, { title: 'To do' }).expect(201);
    expect(res.body).toMatchObject({ title: 'To do', position: 0, ownerId: ids.alice });
    expect(res.body).toEqual(
      expect.objectContaining({ id: expect.any(String), createdAt: expect.any(String) }),
    );

    const withPosition = await postList(tokens.alice, { title: 'Done', position: 3 }).expect(201);
    expect(withPosition.body).toMatchObject({ title: 'Done', position: 3, ownerId: ids.alice });
  });

  it('returns 400 naming the field when the title is empty or missing', async () => {
    for (const body of [{ title: '' }, {}]) {
      const res = await postList(tokens.alice, body).expect(400);
      expect(res.body.message).toContainEqual(expect.stringContaining('title'));
    }
  });

  it('returns 401 without a token', async () => {
    await postList(undefined, { title: 'To do' }).expect(401);
  });
});

describe('PATCH /api/lists/{id} (ticket #9)', () => {
  it('returns 200 with the updated list when the current user owns it', async () => {
    const created = await postList(tokens.alice, { title: 'To do' }).expect(201);
    const res = await patchList(created.body.id, tokens.alice, { title: 'Doing', position: 1 }).expect(200);
    expect(res.body).toMatchObject({ id: created.body.id, title: 'Doing', position: 1, ownerId: ids.alice });
  });

  it('returns 403 when the list belongs to another user', async () => {
    const created = await postList(tokens.alice, { title: 'To do' }).expect(201);
    const res = await patchList(created.body.id, tokens.bob, { title: 'Hacked' }).expect(403);
    expect(res.body).toMatchObject({ statusCode: 403, error: 'Forbidden' });
  });

  it('returns 404 for an unknown list id', async () => {
    await patchList('00000000-0000-7000-8000-000000000000', tokens.alice, { title: 'Nobody' }).expect(404);
  });

  it('returns 400 naming the field for an invalid payload', async () => {
    const created = await postList(tokens.alice, { title: 'To do' }).expect(201);
    for (const body of [{ title: '' }, { title: null }, { position: 'first' }]) {
      const res = await patchList(created.body.id, tokens.alice, body).expect(400);
      expect(res.body.message).toContainEqual(expect.stringContaining(Object.keys(body)[0]));
    }
  });
});

describe('DELETE /api/lists/{id} (ticket #10)', () => {
  it('returns 204 and the list no longer appears in GET /api/lists', async () => {
    const created = await postList(tokens.alice, { title: 'To do' }).expect(201);
    const res = await deleteList(created.body.id, tokens.alice).expect(204);
    expect(res.body).toEqual({});

    const lists = await getLists(tokens.alice).expect(200);
    expect(lists.body).toEqual([]);
  });

  it('returns 403 when the list belongs to another user', async () => {
    const created = await postList(tokens.alice, { title: 'To do' }).expect(201);
    await deleteList(created.body.id, tokens.bob).expect(403);
  });

  it('returns 404 for an unknown list id', async () => {
    await deleteList('00000000-0000-7000-8000-000000000000', tokens.alice).expect(404);
  });

  it('returns 401 without a token', async () => {
    const created = await postList(tokens.alice, { title: 'To do' }).expect(201);
    await deleteList(created.body.id).expect(401);
  });
});
