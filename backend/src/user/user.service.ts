import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: createUserDto.companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    return this.prisma.user.create({
      data: createUserDto,
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      include: {
        company: true,
      },
    });
  }

  async findOne(id: number) {
  const user = await this.prisma.user.findUnique({
    where: { id },
    include: {
      company: true,
    },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return user;
}

  async update(id: number, updateUserDto: UpdateUserDto) {
  const user = await this.prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return this.prisma.user.update({
    where: { id },
    data: updateUserDto,
  });
}

  async remove(id: number) {
  const user = await this.prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return this.prisma.user.delete({
    where: { id },
  });
}
}