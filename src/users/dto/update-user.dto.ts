import { ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Role } from '../../generated/prisma/client';

@ApiSchema({ name: 'UpdateUserInput' })
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Alice Martin', minLength: 1, maxLength: 32 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  name?: string;

  @ApiPropertyOptional({ example: 'alice.martin@example.com', format: 'email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: Role, description: 'Only an admin can change a role' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
