import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import type { PublicUser } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ListResponseDto } from './dto/list-response.dto';
import { ListsService } from './lists.service';

@ApiTags('Lists')
@ApiBearerAuth()
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
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired token',
    schema: { example: { statusCode: 401, message: 'Unauthorized' } },
  })
  findAll(@CurrentUser() user: PublicUser): Promise<ListResponseDto[]> {
    return this.listsService.findAll(user.id);
  }
}
