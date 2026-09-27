import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

@ApiSchema({ name: 'LoginInput' })
export class LoginDto {
  @ApiProperty({ example: 'alice@example.com', format: 'email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!', format: 'password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
