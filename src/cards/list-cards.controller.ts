import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import type { PublicUser } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CardsService } from './cards.service';
import { CardResponseDto } from './dto/card-response.dto';

@ApiTags('Cards')
@ApiBearerAuth()
// Every route here is scoped to one of my lists, so 401, 403 and 404 are declared once for the class.
@ApiUnauthorizedResponse({
  description: 'Missing, invalid or expired token',
  schema: { example: { statusCode: 401, message: 'Unauthorized' } },
})
@ApiForbiddenResponse({
  description: 'The list belongs to another user',
  schema: { example: { statusCode: 403, message: 'This list belongs to another user', error: 'Forbidden' } },
})
@ApiNotFoundResponse({
  description: 'Unknown list id',
  schema: { example: { statusCode: 404, message: 'List not found', error: 'Not Found' } },
})
@UseGuards(AuthGuard)
@Controller('lists/:listId/cards')
export class ListCardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  @ApiOperation({ summary: 'List the cards of one of my lists' })
  @ApiOkResponse({
    description: 'The cards of the list, ordered by position (empty array if none)',
    type: [CardResponseDto],
  })
  findAll(@CurrentUser() user: PublicUser, @Param('listId') listId: string): Promise<CardResponseDto[]> {
    return this.cardsService.findAllInList(user.id, listId);
  }
}
