import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { TaskLabel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AssignTaskLabelDto } from './dto/create-task-labels.dto';
@Injectable()
export class TaskLabelsService {
  constructor(private prisma: PrismaService) {}

  async assignLabel(assignTaskLabelDto: AssignTaskLabelDto, userId: string): Promise<TaskLabel> {
    const { taskId, labelId } = assignTaskLabelDto;

    // Verify task exists and user has access to it
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: {
                  where: { userId },
                  select: { role: true },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has access to the project's workspace
    const workspaceAccess = task.project.workspace.members;
    if (workspaceAccess.length === 0) {
      throw new ForbiddenException('You do not have permission to modify labels in this project');
    }

    if (task.project.archive) {
      throw new BadRequestException('Cannot assign label to task in archived project');
    }

    // Verify label exists and belongs to the same project
    const label = await this.prisma.label.findUnique({
      where: { id: labelId },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    if (label.projectId !== task.projectId) {
      throw new BadRequestException('Label does not belong to the same project as the task');
    }

    // Check if label is already assigned to the task
    const existingAssignment = await this.prisma.taskLabel.findUnique({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
    });

    if (existingAssignment) {
      throw new BadRequestException('Label is already assigned to this task');
    }

    return this.prisma.taskLabel.create({
      data: {
        taskId,
        labelId,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        label: {
          select: {
            id: true,
            name: true,
            color: true,
            description: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });
  }

  async findAll(userId: string): Promise<TaskLabel[]> {
    // Get all task labels from projects user has access to
    const accessibleProjects = await this.prisma.project.findMany({
      where: {
        workspace: {
          members: {
            some: { userId },
          },
        },
      },
      select: { id: true },
    });

    if (accessibleProjects.length === 0) {
      throw new ForbiddenException('You do not have permission to view task labels');
    }

    const whereClause: any = {};
    whereClause.task = {
      projectId: { in: accessibleProjects.map((p) => p.id) },
    };

    return this.prisma.taskLabel.findMany({
      where: whereClause,
      include: {
        label: {
          select: {
            id: true,
            name: true,
            color: true,
            description: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(taskId: string, labelId: string, userId: string): Promise<TaskLabel> {
    // Verify task label assignment exists and user has access
    const taskLabel = await this.prisma.taskLabel.findUnique({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
      include: {
        task: {
          include: {
            project: {
              include: {
                workspace: {
                  include: {
                    members: {
                      where: { userId },
                      select: { role: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!taskLabel) {
      throw new NotFoundException('Task label assignment not found');
    }

    // Check if user has access to the project's workspace
    const workspaceAccess = taskLabel.task.project.workspace.members;
    if (workspaceAccess.length === 0) {
      throw new ForbiddenException('You do not have permission to modify labels in this project');
    }

    // Check if project is archived
    if (taskLabel.task.project.archive) {
      throw new BadRequestException('Cannot update label assignment in archived project');
    }

    const updatedTaskLabel = await this.prisma.taskLabel.update({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
      data: {
        updatedBy: userId,
        updatedAt: new Date(),
      },
      include: {
        label: {
          select: {
            id: true,
            name: true,
            color: true,
            description: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return updatedTaskLabel;
  }

  async remove(taskId: string, labelId: string, userId: string): Promise<TaskLabel> {
    // Verify task label assignment exists and user has access
    const taskLabel = await this.prisma.taskLabel.findUnique({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
      include: {
        task: {
          include: {
            project: {
              include: {
                workspace: {
                  include: {
                    members: {
                      where: { userId },
                      select: { role: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!taskLabel) {
      throw new NotFoundException('Task label assignment not found');
    }

    // Check if user has access to the project's workspace
    const workspaceAccess = taskLabel.task.project.workspace.members;
    if (workspaceAccess.length === 0) {
      throw new ForbiddenException('You do not have permission to modify labels in this project');
    }

    // Check if project is archived
    if (taskLabel.task.project.archive) {
      throw new BadRequestException('Cannot remove label from task in archived project');
    }

    // Remove the assignment
    await this.prisma.taskLabel.delete({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
    });
    return taskLabel;
  }
}
