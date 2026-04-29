import { Controller, Get, Param, Body, Patch } from '@nestjs/common';
import { TaskRanksService } from './task-ranks.service';
import { ReorderDto } from './dto/reorder.dto';

@Controller('task-ranks')
export class TaskRanksController {
  constructor(private readonly taskRanksService: TaskRanksService) {}

  @Patch(':taskId/reorder')
  reorder(@Param('taskId') taskId: string, @Body() reorderDto: ReorderDto) {
    return this.taskRanksService.reorder({ taskId, ...reorderDto });
  }

  @Get('rebalance')
  rebalanceAll() {
    // This could be restricted to admins
    return { message: 'Rebalance utility would go here' };
  }
}
