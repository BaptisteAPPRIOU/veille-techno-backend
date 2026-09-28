import { Module } from '@nestjs/common';
import { ListsModule } from '../lists/lists.module';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { ListCardsController } from './list-cards.controller';

@Module({
  imports: [ListsModule],
  controllers: [ListCardsController, CardsController],
  providers: [CardsService],
})
export class CardsModule {}
