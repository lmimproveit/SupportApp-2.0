import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UserRole } from '../../generated/prisma/client';

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createMessageDto: CreateMessageDto,
    currentUserId: number,
    currentUserRole: UserRole,
    currentCompanyId: number,
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: createMessageDto.ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.companyId !== currentCompanyId) {
      throw new ForbiddenException(
        'You do not have permission to write in this ticket',
      );
    }

    if (
      currentUserRole === UserRole.USER &&
      ticket.userId !== currentUserId
    ) {
      throw new ForbiddenException(
        'You do not have permission to write in this ticket',
      );
    }

    return this.prisma.message.create({
      data: {
        content: createMessageDto.content,
        ticketId: createMessageDto.ticketId,
        userId: currentUserId,
      },
    });
  }

  findAll(currentCompanyId: number) {
    return this.prisma.message.findMany({
      where: {
        ticket: {
          companyId: currentCompanyId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            companyId: true,
          },
        },
        ticket: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findByTicket(
    ticketId: number,
    currentUserId: number,
    currentUserRole: UserRole,
    currentCompanyId: number,
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.companyId !== currentCompanyId) {
      throw new ForbiddenException(
        'You do not have permission to view messages in this ticket',
      );
    }

    if (
      currentUserRole === UserRole.USER &&
      ticket.userId !== currentUserId
    ) {
      throw new ForbiddenException(
        'You do not have permission to view messages in this ticket',
      );
    }

    return this.prisma.message.findMany({
      where: {
        ticketId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            companyId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async remove(id: number, currentCompanyId: number) {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: { ticket: true },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.ticket.companyId !== currentCompanyId) {
      throw new ForbiddenException(
        'You do not have permission to delete this message',
      );
    }

    return this.prisma.message.delete({
      where: { id },
    });
  }
}
