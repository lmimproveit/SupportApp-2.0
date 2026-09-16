import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';

import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { UserRole } from '../../generated/prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  create(@Body() createMessageDto: CreateMessageDto, @Req() req: any) {
    return this.messageService.create(
      createMessageDto,
      req.user.userId,
      req.user.role,
      req.user.companyId,
    );
  }

  @Roles(UserRole.SUPPORT, UserRole.ADMIN)
  @Get()
  findAll(@Req() req: any) {
    return this.messageService.findAll(req.user.companyId);
  }

  @Get('ticket/:ticketId')
  findByTicket(@Param('ticketId') ticketId: string, @Req() req: any) {
    return this.messageService.findByTicket(
      +ticketId,
      req.user.userId,
      req.user.role,
      req.user.companyId,
    );
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.messageService.remove(+id, req.user.companyId);
  }
}
