import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post()
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.messageService.create(createMessageDto);
  }
  @Get()
findAll() {
  return this.messageService.findAll();
}

@Get('ticket/:ticketId')
findByTicket(@Param('ticketId') ticketId: string) {
  return this.messageService.findByTicket(+ticketId);
}

@Delete(':id')
remove(@Param('id') id: string) {
  return this.messageService.remove(+id);
}
}