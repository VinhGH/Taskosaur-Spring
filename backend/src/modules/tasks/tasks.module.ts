import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AccessControlService } from 'src/common/access-control.utils';
import { RecurrenceService } from './recurrence.service';
import { RecurringTasksCronService } from './recurring-tasks-cron.service';
import { ScheduleModule } from '@nestjs/schedule';
import { json, urlencoded } from 'express';

import { PublicModule } from '../public/public.module';
import { TaskSharesController } from './task-shares.controller';
import { QueueModule } from '../queue/queue.module';
import { BulkTaskImportProcessor } from './bulk-task-import.processor';
import { TaskRanksModule } from '../task-ranks/task-ranks.module';
import { S3Module } from '../storage/s3.module';

@Module({
  imports: [
    PrismaModule,
    PublicModule,
    ScheduleModule.forRoot(),
    QueueModule,
    QueueModule.registerQueue({ name: 'bulk-task-import' }),
    TaskRanksModule,
    S3Module,
  ],
  controllers: [TasksController, TaskSharesController],
  providers: [
    TasksService,
    AccessControlService,
    RecurrenceService,
    RecurringTasksCronService,
    BulkTaskImportProcessor,
  ],
  exports: [TasksService],
})
export class TasksModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(json({ limit: '10mb' }), urlencoded({ limit: '10mb', extended: true }))
      .forRoutes({ path: 'tasks/bulk-create', method: RequestMethod.POST });
  }
}
