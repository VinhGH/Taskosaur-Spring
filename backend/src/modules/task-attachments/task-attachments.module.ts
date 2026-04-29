import { Module } from '@nestjs/common';
import { TaskAttachmentsService } from './task-attachments.service';
import { TaskAttachmentsController } from './task-attachments.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { S3Module } from '../storage/s3.module';

@Module({
  imports: [PrismaModule, S3Module],
  controllers: [TaskAttachmentsController],
  providers: [TaskAttachmentsService],
  exports: [TaskAttachmentsService],
})
export class TaskAttachmentsModule {}
