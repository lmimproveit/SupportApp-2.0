import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../generated/prisma/client';
import { MessageService } from './message.service';

describe('MessageService', () => {
  const prisma = {
    ticket: { findUnique: jest.fn() },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };
  let service: MessageService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MessageService(prisma as any);
  });

  it('derives the message author from the authenticated user', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 3, userId: 3, companyId: 1 });
    prisma.message.create.mockResolvedValue({ id: 2 });

    await service.create({ content: 'Hello', ticketId: 3 }, 3, UserRole.USER, 1);

    expect(prisma.message.create).toHaveBeenCalledWith({
      data: { content: 'Hello', ticketId: 3, userId: 3 },
    });
  });

  it('blocks a user from writing in another users ticket', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 3, userId: 3, companyId: 1 });

    await expect(
      service.create({ content: 'Nope', ticketId: 3 }, 4, UserRole.USER, 1),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks messages across companies', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 3, userId: 3, companyId: 1 });

    await expect(
      service.create({ content: 'Nope', ticketId: 3 }, 5, UserRole.SUPPORT, 4),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows support to write in a ticket in the same company', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 3, userId: 3, companyId: 1 });
    prisma.message.create.mockResolvedValue({ id: 4, ticketId: 3, userId: 4 });

    await service.create({ content: 'Support reply', ticketId: 3 }, 4, UserRole.SUPPORT, 1);

    expect(prisma.message.create).toHaveBeenCalledWith({
      data: { content: 'Support reply', ticketId: 3, userId: 4 },
    });
  });
});
