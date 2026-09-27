import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Role } from '../../src/generated/prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';

export type TestUser = { email: string; password: string; name: string };

/** Register a user through the API, optionally promote it to admin, then log in. */
export async function signUpAndLogin(app: INestApplication, user: TestUser, role: Role = Role.user) {
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
