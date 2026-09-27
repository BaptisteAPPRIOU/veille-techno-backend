import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PublicUser } from '../auth/auth.guard';
import { Role } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async update(actor: PublicUser, id: string, dto: UpdateUserDto): Promise<PublicUser> {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    // Existence first, then rights: a plain user may only touch their own profile, and never their role.
    const isAdmin = actor.role === Role.admin;
    if (!isAdmin && actor.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    if (!isAdmin && dto.role !== undefined) {
      throw new ForbiddenException('Only an admin can change a role');
    }

    return this.prisma.user.update({ where: { id }, data: dto });
  }
}
