import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'AuthToken' })
export class AuthTokenDto {
  @ApiProperty({
    description: 'JWT carrying the user id (`sub`) and an expiration (`exp`), never the password',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMTk5YTFiMi1jM2Q0LTdlNWYtOGE5Yi0wYzFkMmUzZjRhNWIifQ.signature',
  })
  accessToken: string;
}
