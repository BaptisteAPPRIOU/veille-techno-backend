import { Injectable } from '@nestjs/common';
import { List } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListDto } from './dto/create-list.dto';

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

  create(ownerId: string, dto: CreateListDto): Promise<List> {
    return this.prisma.list.create({ data: { ...dto, ownerId } });
  }
}
