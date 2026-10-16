import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../../generated/prisma/client';
import { CreateInternalTaskDto, UpdateInternalTaskDto } from './internal-task.dto';

@Injectable()
export class InternalTaskService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateAssignee(id: number | undefined, companyId: number) {
    if (id === undefined) return;
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.companyId !== companyId || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPPORT)) {
      throw new ForbiddenException('Invalid assignee');
    }
  }

  async create(dto: CreateInternalTaskDto, userId: number, companyId: number) {
    await this.validateAssignee(dto.assignedToId, companyId);
    const { dueDate, ...rest } = dto;
    return this.prisma.internalTask.create({
      data: { ...rest, ...(dueDate ? { dueDate: new Date(dueDate) } : {}), createdById: userId, companyId },
    });
  }

  list(companyId: number) {
    return this.prisma.internalTask.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } });
  }

  async get(id: number, companyId: number) {
    const task = await this.prisma.internalTask.findFirst({ where: { id, companyId } });
    if (!task) throw new NotFoundException('Internal task not found');
    return task;
  }

  async update(id: number, dto: UpdateInternalTaskDto, companyId: number) {
    await this.get(id, companyId);
    await this.validateAssignee(dto.assignedToId, companyId);
    const { dueDate, ...rest } = dto;
    return this.prisma.internalTask.update({
      where: { id },
      data: { ...rest, ...(dueDate ? { dueDate: new Date(dueDate) } : {}) },
    });
  }

  async remove(id: number, companyId: number) {
    await this.get(id, companyId);
    return this.prisma.internalTask.delete({ where: { id } });
  }
}
