import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InternalTaskController } from './internal-task.controller';
import { InternalTaskService } from './internal-task.service';

@Module({
  imports: [PrismaModule],
  controllers: [InternalTaskController],
  providers: [InternalTaskService],
})
export class InternalTaskModule {}
