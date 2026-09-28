import { Injectable, NotFoundException } from '@nestjs/common';
import { Card } from '../generated/prisma/client';
import { ListsService } from '../lists/lists.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto } from './dto/create-card.dto';

@Injectable()
export class CardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly listsService: ListsService,
  ) {}

  async findAllInList(ownerId: string, listId: string): Promise<Card[]> {
    // The list must exist and be mine (404 then 403): same check as the lists module, not duplicated.
    await this.listsService.findOwned(listId, ownerId);
    return this.prisma.card.findMany({
      where: { listId },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async createInList(ownerId: string, listId: string, dto: CreateCardDto): Promise<Card> {
    await this.listsService.findOwned(listId, ownerId);
    return this.prisma.card.create({ data: { ...dto, listId } });
  }

  // Rights go through the parent list: the card must exist (404), then its list must be mine (403).
  async findOwned(id: string, ownerId: string): Promise<Card> {
    const card = await this.prisma.card.findUnique({ where: { id } });
    if (!card) {
      throw new NotFoundException('Card not found');
    }
    await this.listsService.findOwned(card.listId, ownerId);
    return card;
  }
}
