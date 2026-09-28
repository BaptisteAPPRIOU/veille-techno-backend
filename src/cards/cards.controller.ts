import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
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
import { UpdateCardDto } from './dto/update-card.dto';

@ApiTags('Cards')
@ApiBearerAuth()
// Every route here targets one card through its parent list, so 401, 403 and 404 are declared once.
@ApiUnauthorizedResponse({
  description: 'Missing, invalid or expired token',
  schema: { example: { statusCode: 401, message: 'Unauthorized' } },
})
@ApiForbiddenResponse({
  description: 'The parent list of the card, or the target list of a move, belongs to another user',
  schema: { example: { statusCode: 403, message: 'This list belongs to another user', error: 'Forbidden' } },
})
@ApiNotFoundResponse({
  description: 'Unknown card id, or unknown target list id for a move',
  schema: { example: { statusCode: 404, message: 'Card not found', error: 'Not Found' } },
})
@UseGuards(AuthGuard)
@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get one card of one of my lists' })
  @ApiOkResponse({ description: 'The card', type: CardResponseDto })
  findOne(@CurrentUser() user: PublicUser, @Param('id') id: string): Promise<CardResponseDto> {
    return this.cardsService.findOwned(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a card (title, description, position) or move it to another list of mine',
  })
  @ApiOkResponse({ description: 'Updated card', type: CardResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid payload (empty title, non-integer position, null listId)',
    schema: { example: { statusCode: 400, message: ['title should not be empty'], error: 'Bad Request' } },
  })
  update(
    @CurrentUser() user: PublicUser,
    @Param('id') id: string,
    @Body() dto: UpdateCardDto,
  ): Promise<CardResponseDto> {
    return this.cardsService.update(user.id, id, dto);
  }
}
