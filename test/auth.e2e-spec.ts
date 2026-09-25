import { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './helpers/app';
import { resetDb } from './helpers/db';

const validUser = { email: 'alice@example.com', password: 'Password123!', name: 'Alice' };

describe('POST /api/auth/register (ticket #3)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDb(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const register = (body: object) => request(app.getHttpServer()).post('/api/auth/register').send(body);

  // Test cases
  it('creates the user and returns 201 with its public fields', async () => {
    const res = await register(validUser).expect(201);
    expect(res.body).toMatchObject({ email: validUser.email, name: validUser.name, role: 'user' });
    expect(res.body.id).toEqual(expect.any(String));
    expect(res.body.createdAt).toEqual(expect.any(String));
  });

  it('never returns the password, neither plain nor hashed', async () => {
    const res = await register(validUser).expect(201);
    expect(res.body).not.toHaveProperty('password');
    expect(JSON.stringify(res.body)).not.toContain(validUser.password);
    expect(JSON.stringify(res.body)).not.toContain('$2b$');
  });

  it('stores a bcrypt hash of the password, never the plain value', async () => {
    await register(validUser).expect(201);
    const prisma = app.get(PrismaService);
    const stored = await prisma.user.findUniqueOrThrow({
      where: { email: validUser.email },
      omit: { password: false },
    });
    expect(stored.password).not.toBe(validUser.password);
    await expect(bcrypt.compare(validUser.password, stored.password)).resolves.toBe(true);
  });

  it('returns 409 with an explicit message when the email is already in use', async () => {
    await register(validUser).expect(201);
    const res = await register({ ...validUser, name: 'Alice again' }).expect(409);
    expect(res.body).toMatchObject({ statusCode: 409, message: 'Email already in use', error: 'Conflict' });
  });

  it('returns 400 naming the field when the email is invalid', async () => {
    const res = await register({ ...validUser, email: 'not-an-email' }).expect(400);
    expect(res.body.statusCode).toBe(400);
    expect(res.body.message).toEqual([expect.stringContaining('email')]);
  });

  it('returns 400 naming the field when the password is too short', async () => {
    const res = await register({ ...validUser, password: 'short' }).expect(400);
    expect(res.body.message).toEqual([expect.stringContaining('password')]);
  });

  it('returns 400 naming the field when the name is empty or longer than 32 characters', async () => {
    const empty = await register({ ...validUser, name: '' }).expect(400);
    expect(empty.body.message).toEqual(expect.arrayContaining([expect.stringContaining('name')]));

    const tooLong = await register({ ...validUser, name: 'a'.repeat(33) }).expect(400);
    expect(tooLong.body.message).toEqual([expect.stringContaining('name')]);
  });
});
