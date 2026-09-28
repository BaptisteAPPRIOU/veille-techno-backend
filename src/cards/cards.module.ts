import { Module } from '@nestjs/common';
import { ListsModule } from '../lists/lists.module';
import { CardsService } from './cards.service';
import { ListCardsController } from './list-cards.controller';

@Module({
  imports: [ListsModule],
  controllers: [ListCardsController],
  providers: [CardsService],
})
export class CardsModule {}
