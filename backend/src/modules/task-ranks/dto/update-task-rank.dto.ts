import { PartialType } from '@nestjs/swagger';
import { CreateTaskRankDto } from './create-task-rank.dto';

export class UpdateTaskRankDto extends PartialType(CreateTaskRankDto) {}
