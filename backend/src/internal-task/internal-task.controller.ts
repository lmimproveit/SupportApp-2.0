import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { UserRole } from '../../generated/prisma/client';
import { CreateInternalTaskDto, UpdateInternalTaskDto } from './internal-task.dto';
import { InternalTaskService } from './internal-task.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('internal-tasks')
export class InternalTaskController {
  constructor(private readonly tasks: InternalTaskService) {}
  @Post() create(@Body() dto: CreateInternalTaskDto, @Req() req: any) {
    return this.tasks.create(dto, req.user.userId, req.user.companyId);
  }
  @Get() list(@Req() req: any) { return this.tasks.list(req.user.companyId); }
  @Get(':id') get(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.tasks.get(id, req.user.companyId);
  }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInternalTaskDto, @Req() req: any) {
    return this.tasks.update(id, dto, req.user.companyId);
  }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.tasks.remove(id, req.user.companyId);
  }
}
