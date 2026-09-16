import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { UserRole } from '../../generated/prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  create(@Body() createTicketDto: CreateTicketDto, @Req() req: any) {
    return this.ticketService.create(
      createTicketDto,
      req.user.userId,
      req.user.companyId,
    );
  }

  @Roles(UserRole.SUPPORT, UserRole.ADMIN)
  @Get()
  findAll(@Req() req: any) {
    return this.ticketService.findAll(req.user.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.ticketService.findOne(
      +id,
      req.user.userId,
      req.user.role,
      req.user.companyId,
    );
  }

  @Roles(UserRole.SUPPORT, UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
    @Req() req: any,
  ) {
    return this.ticketService.update(
      +id,
      updateTicketDto,
      req.user.companyId,
    );
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.ticketService.remove(+id, req.user.companyId);
  }
}
