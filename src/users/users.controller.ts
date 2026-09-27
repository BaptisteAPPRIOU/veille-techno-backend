import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
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
import { UserResponseDto } from '../auth/dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user: own profile, or any user and its role as an admin' })
  @ApiOkResponse({ description: 'Updated user (the password is never returned)', type: UserResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid payload (e.g. unknown role)',
    schema: {
      example: {
        statusCode: 400,
        message: ['role must be one of the following values: user, admin'],
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, invalid or expired token',
    schema: { example: { statusCode: 401, message: 'Unauthorized' } },
  })
  @ApiForbiddenResponse({
    description: "Another user's profile (non-admin), or changing one's own role",
    schema: {
      example: { statusCode: 403, message: 'You can only update your own profile', error: 'Forbidden' },
    },
  })
  @ApiNotFoundResponse({
    description: 'Unknown user id',
    schema: { example: { statusCode: 404, message: 'User not found', error: 'Not Found' } },
  })
  @ApiConflictResponse({
    description: 'Email already in use',
    schema: { example: { statusCode: 409, message: 'Value already in use for: email', error: 'Conflict' } },
  })
  update(
    @CurrentUser() actor: PublicUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(actor, id, dto);
  }
}
