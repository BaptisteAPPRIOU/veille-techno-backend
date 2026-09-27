import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'List' })
export class ListResponseDto {
  @ApiProperty({ example: '0199a1c0-5e6f-7a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ example: 'To do' })
  title: string;

  @ApiProperty({ example: 0, type: 'integer' })
  position: number;

  @ApiProperty({
    example: '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b',
    description: 'Id of the user who owns the list',
  })
  ownerId: string;

  @ApiProperty({ example: '2026-09-25T10:00:00.000Z' })
  createdAt: Date;
}
