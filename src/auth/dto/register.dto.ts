import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

@ApiSchema({ name: 'RegisterInput' })
export class RegisterDto {
  @ApiProperty({ example: 'alice@example.com', format: 'email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!', format: 'password', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Alice', minLength: 1, maxLength: 32 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(32)
  name: string;
}
