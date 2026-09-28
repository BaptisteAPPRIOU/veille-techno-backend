import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

@ApiSchema({ name: 'CreateCardInput' })
export class CreateCardDto {
  @ApiProperty({ example: 'Write the README' })
  @IsString()
  @IsNotEmpty()
  title: string;

  // description is nullable in the schema, so null is a valid value here; position is not.
  @ApiPropertyOptional({ example: 'Installation, usage and implementation choices' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 0, type: 'integer', description: 'Defaults to 0' })
  @ValidateIf((_, value) => value !== undefined)
  @IsInt()
  position?: number;
}
