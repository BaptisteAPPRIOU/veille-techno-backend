import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Role } from '../../generated/prisma/client';

@ApiSchema({ name: 'User' })
export class UserResponseDto {
  @ApiProperty({ example: '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b' })
  id: string;

  @ApiProperty({ example: 'alice@example.com', format: 'email' })
  email: string;

  @ApiProperty({ example: 'Alice' })
  name: string;

  @ApiProperty({ enum: Role, example: Role.user })
  role: Role;

  @ApiProperty({ example: '2026-09-25T10:00:00.000Z' })
  createdAt: Date;
}
