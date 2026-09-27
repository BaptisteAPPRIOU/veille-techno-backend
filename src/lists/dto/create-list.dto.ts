import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

@ApiSchema({ name: 'CreateListInput' })
export class CreateListDto {
  @ApiProperty({ example: 'To do' })
  @IsString()
  @IsNotEmpty()
  title: string;

  // Not @IsOptional(): it would let null through, which Prisma rejects with a 500.
  @ApiPropertyOptional({ example: 0, type: 'integer', description: 'Defaults to 0' })
  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  position?: number;
}
