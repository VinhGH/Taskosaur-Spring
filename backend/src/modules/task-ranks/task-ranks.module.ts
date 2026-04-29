import { Module } from '@nestjs/common';
import { TaskRanksService } from './task-ranks.service';
import { TaskRanksController } from './task-ranks.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TaskRanksController],
  providers: [TaskRanksService],
  exports: [TaskRanksService],
})
export class TaskRanksModule {}
