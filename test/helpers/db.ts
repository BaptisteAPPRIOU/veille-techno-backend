import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';

/** Clear the test database in foreign key order. Call from `beforeEach`. */
export async function resetDb(app: INestApplication): Promise<void> {
  const prisma = app.get(PrismaService);
  await prisma.card.deleteMany();
  await prisma.list.deleteMany();
  await prisma.user.deleteMany();
}
