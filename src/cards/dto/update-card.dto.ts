import { ApiPropertyOptional, ApiSchema, PartialType } from '@nestjs/swagger';
import { IsString, ValidateIf } from 'class-validator';
import { CreateCardDto } from './create-card.dto';

// Same rule as the lists: a field may be absent but never null, except description which is nullable.
@ApiSchema({ name: 'UpdateCardInput' })
export class UpdateCardDto extends PartialType(CreateCardDto, { skipNullProperties: false }) {
  @ApiPropertyOptional({
    example: '0199a1c0-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'Move the card to another list of mine',
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  listId?: string;
}
