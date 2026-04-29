import { Test, TestingModule } from '@nestjs/testing';
import { TaskRanksController } from './task-ranks.controller';
import { TaskRanksService } from './task-ranks.service';

describe('TaskRanksController', () => {
  let controller: TaskRanksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskRanksController],
      providers: [TaskRanksService],
    }).compile();

    controller = module.get<TaskRanksController>(TaskRanksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
