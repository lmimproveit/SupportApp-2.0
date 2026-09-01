import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMessageDto: CreateMessageDto) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: createMessageDto.ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: createMessageDto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.message.create({
      data: createMessageDto,
    });
  }

  findAll() {
    return this.prisma.message.findMany({
      include: {
        user: true,
        ticket: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findByTicket(ticketId: number) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return this.prisma.message.findMany({
      where: {
        ticketId,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async remove(id: number) {
    const message = await this.prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return this.prisma.message.delete({
      where: { id },
    });
  }
}