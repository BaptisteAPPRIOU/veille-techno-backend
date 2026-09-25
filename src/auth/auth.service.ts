import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

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
}
