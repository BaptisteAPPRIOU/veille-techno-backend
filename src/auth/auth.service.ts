import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthTokenDto } from './dto/auth-token.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<Omit<User, 'password'>> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    // Only the bcrypt hash reaches the database; never log `dto`, it holds the plain password.
    const password = await bcrypt.hash(dto.password, SALT_ROUNDS);

    // PrismaService omits `password` globally, so the created user is already safe to return.
    return this.prisma.user.create({ data: { email: dto.email, password, name: dto.name } });
  }

  async login(dto: LoginDto): Promise<AuthTokenDto> {
    // The only query that needs the hash: the global omit is overridden just here.
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      omit: { password: false },
    });
    const passwordMatches = user ? await bcrypt.compare(dto.password, user.password) : false;
    if (!user || !passwordMatches) {
      // Same message whether the email is unknown or the password is wrong.
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.jwtService.signAsync({ sub: user.id });
    return { accessToken };
  }
}
