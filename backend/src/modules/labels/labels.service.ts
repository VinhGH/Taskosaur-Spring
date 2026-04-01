import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Label } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { AssignLabelDto, AssignMultipleLabelsDto } from './dto/assign-label.dto';

@Injectable()
export class LabelsService {
  constructor(private prisma: PrismaService) {}

  async create(createLabelDto: CreateLabelDto, userId: string): Promise<Label> {
    // Check if project exists and user has access
    const project = await this.prisma.project.findUnique({
      where: { id: createLabelDto.projectId },
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
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user has access to the workspace
    if (project.workspace.members.length === 0) {
      throw new ForbiddenException('You do not have permission to create labels in this project');
    }

    try {
      return await this.prisma.label.create({
        data: {
          ...createLabelDto,
          createdBy: userId,
          updatedBy: userId,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              slug: true,
              workspace: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  organization: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
          createdByUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          updatedByUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              taskLabels: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Label with this name already exists in this project');
      }
      throw error;
    }
  }

  async findAll(projectId: string | undefined, userId: string): Promise<Label[]> {
    const whereClause: any = {};

    if (projectId) {
      // Verify user has access to the project
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
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
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // Check if user has access to the workspace
      if (project.workspace.members.length === 0) {
        throw new ForbiddenException('You do not have permission to view labels in this project');
      }

      whereClause.projectId = projectId;
    } else {
      // If no projectId, get all labels from projects user has access to
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

      whereClause.projectId = { in: accessibleProjects.map((p) => p.id) };
    }

    return this.prisma.label.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            taskLabels: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string, userId: string): Promise<Label> {
    const label = await this.prisma.label.findUnique({
      where: { id },
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
        taskLabels: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                slug: true,
                type: true,
                priority: true,
                status: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                    category: true,
                  },
                },
                assignees: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            taskLabels: true,
          },
        },
      },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    // Check if user has access to the workspace
    if (label.project.workspace.members.length === 0) {
      throw new ForbiddenException('You do not have permission to view this label');
    }

    return label;
  }

  async update(id: string, updateLabelDto: UpdateLabelDto, userId: string): Promise<Label> {
    // Verify label exists and user has access
    const label = await this.prisma.label.findUnique({
      where: { id },
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

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    // Check if user has access to the workspace
    if (label.project.workspace.members.length === 0) {
      throw new ForbiddenException('You do not have permission to update labels in this project');
    }

    try {
      const updatedLabel = await this.prisma.label.update({
        where: { id },
        data: {
          ...updateLabelDto,
          updatedBy: userId,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              slug: true,
              workspace: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          createdByUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          updatedByUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              taskLabels: true,
            },
          },
        },
      });

      return updatedLabel;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Label with this name already exists in this project');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Label not found');
      }
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<void> {
    // Verify label exists and user has access
    const label = await this.prisma.label.findUnique({
      where: { id },
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

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    // Check if user has access to the workspace
    if (label.project.workspace.members.length === 0) {
      throw new ForbiddenException('You do not have permission to delete labels in this project');
    }

    try {
      await this.prisma.label.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Label not found');
      }
      throw error;
    }
  }

  // Task Label Management
  async assignLabelToTask(assignLabelDto: AssignLabelDto, userId: string): Promise<void> {
    const { taskId, labelId } = assignLabelDto;

    // Verify task and label exist and user has access
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

    // Check if user has access to the workspace
    if (task.project.workspace.members.length === 0) {
      throw new ForbiddenException('You do not have permission to modify labels in this project');
    }

    const label = await this.prisma.label.findUnique({
      where: { id: labelId },
      select: { projectId: true },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    if (task.projectId !== label.projectId) {
      throw new ConflictException('Task and label must belong to the same project');
    }

    try {
      await this.prisma.taskLabel.create({
        data: {
          taskId,
          labelId,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Label is already assigned to this task');
      }
      throw error;
    }
  }

  async removeLabelFromTask(taskId: string, labelId: string, userId: string): Promise<void> {
    // Verify task exists and user has access
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

    // Check if user has access to the workspace
    if (task.project.workspace.members.length === 0) {
      throw new ForbiddenException('You do not have permission to modify labels in this project');
    }

    try {
      await this.prisma.taskLabel.delete({
        where: {
          taskId_labelId: {
            taskId,
            labelId,
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Label assignment not found');
      }
      throw error;
    }
  }

  async assignMultipleLabelsToTask(
    assignMultipleLabelsDto: AssignMultipleLabelsDto,
    userId: string,
  ): Promise<void> {
    const { taskId, labelIds } = assignMultipleLabelsDto;

    // Validate labelIds array is not empty
    if (!labelIds || labelIds.length === 0) {
      throw new BadRequestException('labelIds array cannot be empty');
    }

    // Verify task exists and user has access
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

    // Check if user has access to the workspace
    if (task.project.workspace.members.length === 0) {
      throw new ForbiddenException('You do not have permission to modify labels in this project');
    }

    // Verify all labels exist and belong to the same project
    const labels = await this.prisma.label.findMany({
      where: {
        id: { in: labelIds },
        projectId: task.projectId,
      },
      select: { id: true },
    });

    if (labels.length !== labelIds.length) {
      throw new NotFoundException(
        'One or more labels not found or do not belong to the same project',
      );
    }

    // Remove existing labels and add new ones
    await this.prisma.$transaction(async (tx) => {
      // Remove existing labels
      await tx.taskLabel.deleteMany({
        where: { taskId },
      });

      // Add new labels
      if (labelIds.length > 0) {
        await tx.taskLabel.createMany({
          data: labelIds.map((labelId) => ({
            taskId,
            labelId,
          })),
        });
      }
    });
  }

  async getTaskLabels(taskId: string, userId: string): Promise<Label[]> {
    // Verify task exists and user has access
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

    // Check if user has access to the workspace
    if (task.project.workspace.members.length === 0) {
      throw new ForbiddenException('You do not have permission to view labels in this project');
    }

    const taskLabels = await this.prisma.taskLabel.findMany({
      where: { taskId },
      include: {
        label: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    return taskLabels.map((tl) => tl.label);
  }
}
