import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { List } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';

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

  async update(ownerId: string, id: string, dto: UpdateListDto): Promise<List> {
    await this.findOwned(id, ownerId);
    return this.prisma.list.update({ where: { id }, data: dto });
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.findOwned(id, ownerId);
    // The cards of the list go with it (onDelete: Cascade in the Prisma schema), see the README.
    await this.prisma.list.delete({ where: { id } });
  }

  // Existence first, then ownership: same order as the users module.
  async findOwned(id: string, ownerId: string): Promise<List> {
    const list = await this.prisma.list.findUnique({ where: { id } });
    if (!list) {
      throw new NotFoundException('List not found');
    }
    if (list.ownerId !== ownerId) {
      throw new ForbiddenException('This list belongs to another user');
    }
    return list;
  }
}
