import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../../generated/prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, currentCompanyId: number) {
    if (createUserDto.companyId !== currentCompanyId) {
      throw new ForbiddenException('You can only create users in your own company');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: currentCompanyId },
    });
    if (!company) throw new NotFoundException('Company not found');

    const normalizedEmail = createUserDto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) throw new ConflictException('Email already in use');

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        role: createUserDto.role ?? UserRole.USER,
        companyId: currentCompanyId,
      },
    });

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  findAll(currentCompanyId: number) {
    return this.prisma.user.findMany({
      where: { companyId: currentCompanyId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        companyId: true,
        company: true,
      },
    });
  }

  async findOne(
    id: number,
    currentUserId: number,
    currentUserRole: UserRole,
    currentCompanyId: number,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        companyId: true,
        company: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.companyId !== currentCompanyId) {
      throw new ForbiddenException('You do not have permission to view this user');
    }
    if (currentUserRole === UserRole.USER && id !== currentUserId) {
      throw new ForbiddenException('You can only view your own user profile');
    }

    return user;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    currentCompanyId: number,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.companyId !== currentCompanyId) {
      throw new ForbiddenException('You do not have permission to update this user');
    }

    if (updateUserDto.companyId !== undefined && updateUserDto.companyId !== currentCompanyId) {
      throw new ForbiddenException('Users cannot be moved to another company');
    }

    const data = {
      ...updateUserDto,
      ...(updateUserDto.email
        ? { email: updateUserDto.email.trim().toLowerCase() }
        : {}),
    };

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });
    const { password: _, ...safeUser } = updatedUser;
    return safeUser;
  }

  async remove(id: number, currentCompanyId: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.companyId !== currentCompanyId) {
      throw new ForbiddenException('You do not have permission to delete this user');
    }

    const deletedUser = await this.prisma.user.delete({ where: { id } });
    const { password: _, ...safeUser } = deletedUser;
    return safeUser;
  }
}
