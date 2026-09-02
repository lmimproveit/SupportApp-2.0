import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class TicketService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTicketDto: CreateTicketDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: createTicketDto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const company = await this.prisma.company.findUnique({
      where: { id: createTicketDto.companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.ticket.create({
      data: createTicketDto,
    });
  }

  findAll() {
    return this.prisma.ticket.findMany({
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
        company: true,
        assignedTo: {
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
    });
  }

  async findOne(id: number) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
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
        company: true,
        assignedTo: {
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
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async update(id: number, updateTicketDto: UpdateTicketDto) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (updateTicketDto.assignedToId !== undefined) {
      const assignedUser = await this.prisma.user.findUnique({
        where: { id: updateTicketDto.assignedToId },
      });

      if (!assignedUser) {
        throw new NotFoundException('Assigned user not found');
      }
    }

    return this.prisma.ticket.update({
      where: { id },
      data: updateTicketDto,
    });
  }

  async remove(id: number) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return this.prisma.ticket.delete({
      where: { id },
    });
  }
}