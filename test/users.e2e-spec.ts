import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Role } from '../src/generated/prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './helpers/app';
import { resetDb } from './helpers/db';

const alice = { email: 'alice@example.com', password: 'Password123!', name: 'Alice' };
const bob = { email: 'bob@example.com', password: 'Password123!', name: 'Bob' };
const admin = { email: 'admin@example.com', password: 'Password123!', name: 'Admin' };

let app: INestApplication;
const ids: Record<string, string> = {};
const tokens: Record<string, string> = {};

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
});

async function signUpAndLogin(user: typeof alice, role: Role = Role.user) {
  const registered = await request(app.getHttpServer()).post('/api/auth/register').send(user).expect(201);
  if (role === Role.admin) {
    // Registration never creates admins: promote directly in the database for the tests.
    await app.get(PrismaService).user.update({ where: { id: registered.body.id }, data: { role } });
  }
  const login = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email: user.email, password: user.password })
    .expect(200);
  return { id: registered.body.id as string, token: login.body.accessToken as string };
}

beforeEach(async () => {
  await resetDb(app);
  for (const [key, user, role] of [
    ['alice', alice, Role.user],
    ['bob', bob, Role.user],
    ['admin', admin, Role.admin],
  ] as const) {
    const { id, token } = await signUpAndLogin(user, role);
    ids[key] = id;
    tokens[key] = token;
  }
});

const patchUser = (id: string, token: string | undefined, body: object) => {
  const req = request(app.getHttpServer()).patch(`/api/users/${id}`).send(body);
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
};

describe('PATCH /api/users/{id} (ticket #6)', () => {
  it('lets a user update their own profile and returns 200 without the password', async () => {
    const res = await patchUser(ids.alice, tokens.alice, { name: 'Alice Martin' }).expect(200);
    expect(res.body).toMatchObject({ id: ids.alice, email: alice.email, name: 'Alice Martin', role: 'user' });
    expect(res.body).not.toHaveProperty('password');
  });

  it('lets an admin change the role of another user', async () => {
    const res = await patchUser(ids.bob, tokens.admin, { role: 'admin' }).expect(200);
    expect(res.body).toMatchObject({ id: ids.bob, role: 'admin' });
  });

  it("returns 403 when a non-admin updates someone else's profile, whatever the field", async () => {
    const res = await patchUser(ids.bob, tokens.alice, { name: 'Hacked' }).expect(403);
    expect(res.body).toMatchObject({ statusCode: 403, error: 'Forbidden' });
  });

  it('returns 403 when a non-admin tries to change their own role', async () => {
    const res = await patchUser(ids.alice, tokens.alice, { role: 'admin' }).expect(403);
    expect(res.body.message).toMatch(/admin/);
  });

  it('returns 404 for an unknown user id', async () => {
    await patchUser('00000000-0000-7000-8000-000000000000', tokens.alice, { name: 'Nobody' }).expect(404);
  });

  it('returns 400 naming the field for an unknown role', async () => {
    const res = await patchUser(ids.alice, tokens.alice, { role: 'superuser' }).expect(400);
    expect(res.body.message).toEqual([expect.stringContaining('role')]);
  });

  it('returns 400 naming the field when it is null rather than absent', async () => {
    const res = await patchUser(ids.alice, tokens.alice, { name: null }).expect(400);
    expect(res.body.message).toContainEqual(expect.stringContaining('name'));
  });

  it('returns 401 without a token or with an invalid one', async () => {
    await patchUser(ids.alice, undefined, { name: 'X' }).expect(401);
    await patchUser(ids.alice, 'not-a-jwt', { name: 'X' }).expect(401);
  });
});
