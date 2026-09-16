import { UpdateTicketDto } from './dto/update-ticket.dto';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UserRole } from '../../generated/prisma/client';

@Injectable()
export class TicketService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTicketDto: CreateTicketDto, currentUserId: number, currentCompanyId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: currentUserId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.companyId !== currentCompanyId) throw new ForbiddenException('Invalid company access');
    return this.prisma.ticket.create({ data: { ...createTicketDto, userId: currentUserId, companyId: currentCompanyId } });
  }

  findAll(currentCompanyId: number) {
    return this.prisma.ticket.findMany({
      where: { companyId: currentCompanyId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, role: true, companyId: true } },
        company: true,
        assignedTo: { select: { id: true, email: true, firstName: true, lastName: true, role: true, companyId: true } },
      },
    });
  }

  async findOne(id: number, currentUserId: number, currentUserRole: UserRole, currentCompanyId: number) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, role: true, companyId: true } },
        company: true,
        assignedTo: { select: { id: true, email: true, firstName: true, lastName: true, role: true, companyId: true } },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.companyId !== currentCompanyId) throw new ForbiddenException('You do not have permission to view this ticket');
    if (currentUserRole === UserRole.USER && ticket.userId !== currentUserId) throw new ForbiddenException('You do not have permission to view this ticket');
    return ticket;
  }

  async update(id: number, updateTicketDto: UpdateTicketDto, currentCompanyId: number) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.companyId !== currentCompanyId) throw new ForbiddenException('You do not have permission to update this ticket');

    if (updateTicketDto.assignedToId !== undefined) {
      const assignedUser = await this.prisma.user.findUnique({ where: { id: updateTicketDto.assignedToId } });
      if (!assignedUser) throw new NotFoundException('Assigned user not found');
      if (assignedUser.companyId !== currentCompanyId) throw new ForbiddenException('Assigned user belongs to another company');
      if (assignedUser.role !== UserRole.SUPPORT && assignedUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Tickets can only be assigned to support or admin users');
      }
    }

    return this.prisma.ticket.update({ where: { id }, data: updateTicketDto });
  }

  async remove(id: number, currentCompanyId: number) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.companyId !== currentCompanyId) throw new ForbiddenException('You do not have permission to delete this ticket');
    return this.prisma.ticket.delete({ where: { id } });
  }
}
