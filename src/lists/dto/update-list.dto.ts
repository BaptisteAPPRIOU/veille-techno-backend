import { ApiSchema, PartialType } from '@nestjs/swagger';
import { CreateListDto } from './create-list.dto';

// skipNullProperties: false → a field may be absent but never null (Prisma would answer 500).
@ApiSchema({ name: 'UpdateListInput' })
export class UpdateListDto extends PartialType(CreateListDto, { skipNullProperties: false }) {}
