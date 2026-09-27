import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
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
import { CreateListDto } from './dto/create-list.dto';
import { ListResponseDto } from './dto/list-response.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { ListsService } from './lists.service';

@ApiTags('Lists')
@ApiBearerAuth()
// Declared once on the class: every route of this controller can answer 401.
@ApiUnauthorizedResponse({
  description: 'Missing, invalid or expired token',
  schema: { example: { statusCode: 401, message: 'Unauthorized' } },
})
@UseGuards(AuthGuard)
@Controller('lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Get()
  @ApiOperation({ summary: 'List the lists of the current user' })
  @ApiOkResponse({
    description: 'The lists owned by the current user (empty array if none)',
    type: [ListResponseDto],
  })
  findAll(@CurrentUser() user: PublicUser): Promise<ListResponseDto[]> {
    return this.listsService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a list owned by the current user' })
  @ApiCreatedResponse({
    description: 'Created list, with the current user as ownerId',
    type: ListResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Empty or missing title, or a non-integer position',
    schema: { example: { statusCode: 400, message: ['title should not be empty'], error: 'Bad Request' } },
  })
  create(@CurrentUser() user: PublicUser, @Body() dto: CreateListDto): Promise<ListResponseDto> {
    return this.listsService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a list (title, position), restricted to its owner' })
  @ApiOkResponse({ description: 'Updated list', type: ListResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid payload (empty title, non-integer position)',
    schema: { example: { statusCode: 400, message: ['title should not be empty'], error: 'Bad Request' } },
  })
  @ApiForbiddenResponse({
    description: 'The list belongs to another user',
    schema: {
      example: { statusCode: 403, message: 'This list belongs to another user', error: 'Forbidden' },
    },
  })
  @ApiNotFoundResponse({
    description: 'Unknown list id',
    schema: { example: { statusCode: 404, message: 'List not found', error: 'Not Found' } },
  })
  update(
    @CurrentUser() user: PublicUser,
    @Param('id') id: string,
    @Body() dto: UpdateListDto,
  ): Promise<ListResponseDto> {
    return this.listsService.update(user.id, id, dto);
  }
}
