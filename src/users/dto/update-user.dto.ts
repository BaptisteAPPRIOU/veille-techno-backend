import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { Role } from '../../generated/prisma/client';

@ApiSchema({ name: 'UpdateUserInput' })
export class UpdateUserDto {
  // Not @IsOptional(): it would also let null through, which Prisma then rejects with a 500. cf Copilot review
  @ApiPropertyOptional({ example: 'Alice Martin', minLength: 1, maxLength: 32 })
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  name?: string;

  @ApiPropertyOptional({ example: 'alice.martin@example.com', format: 'email' })
  @ValidateIf((_, value) => value !== undefined)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: Role, description: 'Only an admin can change a role' })
  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(Role)
  role?: Role;
}
