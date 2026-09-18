import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/client';
import { TicketService } from './ticket.service';

describe('TicketService', () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    ticket: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  let service: TicketService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TicketService(prisma as any);
  });

  it('derives ticket ownership from the authenticated user', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 3, companyId: 1 });
    prisma.ticket.create.mockResolvedValue({ id: 10 });

    await service.create({ title: 'Test', description: 'Body' }, 3, 1);

    expect(prisma.ticket.create).toHaveBeenCalledWith({
      data: { title: 'Test', description: 'Body', userId: 3, companyId: 1 },
    });
  });

  it('blocks a user from viewing another users ticket', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 3, userId: 3, companyId: 1 });

    await expect(service.findOne(3, 4, UserRole.USER, 1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('blocks cross-company ticket access', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 3, userId: 3, companyId: 1 });

    await expect(service.findOne(3, 5, UserRole.SUPPORT, 4)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows support to view a ticket in the same company', async () => {
    const ticket = { id: 3, userId: 3, companyId: 1 };
    prisma.ticket.findUnique.mockResolvedValue(ticket);

    await expect(service.findOne(3, 4, UserRole.SUPPORT, 1)).resolves.toEqual(ticket);
  });

  it('only assigns tickets to support or admin users in the same company', async () => {
    prisma.ticket.findUnique
      .mockResolvedValueOnce({ id: 3, companyId: 1 })
      .mockResolvedValueOnce(null);
    prisma.user.findUnique.mockResolvedValue({ id: 6, companyId: 1, role: UserRole.USER });

    await expect(
      service.update(3, { assignedToId: 6 }, 1),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.ticket.update).not.toHaveBeenCalled();
  });

  it('returns not found for missing tickets', async () => {
    prisma.ticket.findUnique.mockResolvedValue(null);
    await expect(service.findOne(999, 3, UserRole.USER, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
