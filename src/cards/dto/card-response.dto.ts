import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'Card' })
export class CardResponseDto {
  @ApiProperty({ example: '0199a1d0-6f7a-7b8c-9d0e-1f2a3b4c5d6e' })
  id: string;

  @ApiProperty({ example: 'Write the README' })
  title: string;

  // Union types are not reflected by TypeScript: type must be given for Swagger to document a string.
  @ApiPropertyOptional({
    example: 'Installation, usage and implementation choices',
    type: String,
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ example: 0, type: 'integer' })
  position: number;

  @ApiProperty({
    example: '0199a1c0-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'Id of the list the card belongs to',
  })
  listId: string;

  @ApiProperty({ example: '2026-09-25T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-25T10:05:00.000Z' })
  updatedAt: Date;
}
