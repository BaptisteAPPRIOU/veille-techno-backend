import { Injectable } from '@nestjs/common';
import { List } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ListsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(ownerId: string): Promise<List[]> {
    // Scoped by owner: a user only ever sees their own lists.
    return this.prisma.list.findMany({
      where: { ownerId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }
}
