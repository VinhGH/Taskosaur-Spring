import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Organization, ActivityType, Role, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { AccessControlService } from 'src/common/access-control.utils';
import { SettingsService } from '../settings/settings.service';
import { isUUID } from 'class-validator';
import {
  DEFAULT_WORKFLOW,
  DEFAULT_TASK_STATUSES,
  DEFAULT_STATUS_TRANSITIONS,
  DEFAULT_PROJECT,
  DEFAULT_SPRINT,
  DEFAULT_TASKS,
} from '../../constants/defaultWorkflow';
import slugify from 'slugify';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService,
    private accessControl: AccessControlService,
    private settingsService: SettingsService,
  ) {}

  /**
   * Verify user has access to organization and return their role
   * Throws ForbiddenException if user doesn't have access
   */
  private async verifyOrganizationAccess(
    organizationId: string,
    userId: string,
    minimumRole?: Role,
  ): Promise<Role> {
    // Validate UUIDs using same logic as ParseUUIDPipe
    if (!isUUID(organizationId)) {
      throw new BadRequestException('Invalid organization ID format');
    }
    if (!isUUID(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const access = await this.accessControl.getOrgAccess(organizationId, userId);

    if (minimumRole) {
      const roleRank = {
        VIEWER: 0,
        MEMBER: 1,
        MANAGER: 2,
        OWNER: 3,
      };

      if (roleRank[access.role] < roleRank[minimumRole]) {
        throw new ForbiddenException(
          `Insufficient privileges. Required: ${minimumRole}, Your role: ${access.role}`,
        );
      }
    }

    return access.role;
  }

  private async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    const baseSlug = slugify(name, {
      lower: true,
      strict: true, // remove special chars
    });

    let slug = baseSlug;
    let counter = 1;
    const MAX_ITERATIONS = 100; // Prevent DoS attacks

    while (counter <= MAX_ITERATIONS) {
      const exists = await this.prisma.organization.findFirst({
        where: {
          slug,
          ...(excludeId && { id: { not: excludeId } }), // Exclude current org when updating
        },
        select: { id: true },
      });

      if (!exists) break; // slug is available
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    if (counter > MAX_ITERATIONS) {
      this.logger.warn(
        `Failed to generate unique slug for "${name}" after ${MAX_ITERATIONS} attempts`,
      );
      throw new ConflictException(`Unable to generate unique slug. Please try a different name.`);
    }

    return slug;
  }

  async create(
    createOrganizationDto: CreateOrganizationDto,
    userId: string,
  ): Promise<Organization> {
    // Check if org creation is allowed globally
    const allowOrgCreation = await this.settingsService.get('allow_org_creation');
    if (allowOrgCreation === 'false') {
      // Only SUPER_ADMIN can create orgs when disabled
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (user?.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenException(
          'Organization creation is disabled. Please contact your administrator.',
        );
      }
    }

    try {
      // Use Prisma transaction to ensure atomicity of all operations
      const result = await this.prisma.$transaction(async (tx) => {
        const slug = await this.generateUniqueSlug(createOrganizationDto.name);

        // Create organization with default workflow and statuses
        const organization = await tx.organization.create({
          data: {
            name: createOrganizationDto.name,
            description: createOrganizationDto.description,
            avatar: createOrganizationDto.avatar,
            website: createOrganizationDto.website,
            settings: createOrganizationDto.settings,
            ownerId: createOrganizationDto.ownerId,
            slug,
            createdBy: userId,
            updatedBy: userId,
            workflows: {
              create: {
                name: DEFAULT_WORKFLOW.name,
                description: DEFAULT_WORKFLOW.description,
                isDefault: true,
                createdBy: userId,
                updatedBy: userId,
                statuses: {
                  create: DEFAULT_TASK_STATUSES.map((status) => ({
                    name: status.name,
                    color: status.color,
                    category: status.category,
                    position: status.position,
                    isDefault: status.isDefault,
                    createdBy: userId,
                    updatedBy: userId,
                  })),
                },
              },
            },
          },
          include: {
            workflows: {
              where: { isDefault: true },
              include: { statuses: true },
            },
          },
        });

        // Add org member as OWNER
        await tx.organizationMember.create({
          data: {
            userId,
            organizationId: organization.id,
            role: 'OWNER',
            createdBy: userId,
            updatedBy: userId,
          },
        });

        // Set as default organization if user doesn't have one yet
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { defaultOrganizationId: true },
        });
        if (!user?.defaultOrganizationId) {
          await tx.user.update({
            where: { id: userId },
            data: { defaultOrganizationId: organization.id },
          });
        }

        // Create default status transitions
        const defaultWorkflow = organization.workflows[0];
        if (defaultWorkflow) {
          await this.createDefaultStatusTransitions(
            defaultWorkflow.id,
            defaultWorkflow.statuses,
            userId,
            tx,
          );
        }

        // Conditionally create workspace if provided
        let workspace;
        if (createOrganizationDto.defaultWorkspace) {
          const workspaceSlug = await this.generateUniqueWorkspaceSlug(
            createOrganizationDto.defaultWorkspace.name,
            organization.id,
          );

          workspace = await tx.workspace.create({
            data: {
              name: createOrganizationDto.defaultWorkspace.name,
              description: 'Default workspace',
              slug: workspaceSlug,
              organizationId: organization.id,
              createdBy: userId,
              updatedBy: userId,
              members: {
                create: {
                  userId,
                  role: 'OWNER',
                  createdBy: userId,
                  updatedBy: userId,
                },
              },
            },
          });
        }

        // Conditionally create project if provided
        let project:
          | {
              id: string;
              slug: string;
              sprints: Array<{ isDefault: boolean; id: string }>;
              workflow: { statuses: Array<{ id: string; name: string }> } | null;
            }
          | undefined;
        if (createOrganizationDto.defaultProject && workspace) {
          const projectSlug = await this.generateUniqueProjectSlug(
            createOrganizationDto.defaultProject.name,
            workspace.id as string,
          );

          project = await tx.project.create({
            data: {
              name: createOrganizationDto.defaultProject.name,
              description: 'Default project',
              slug: projectSlug,
              workspaceId: workspace.id,
              workflowId: defaultWorkflow.id,
              createdBy: userId,
              updatedBy: userId,
              color: DEFAULT_PROJECT.color,
              sprints: {
                create: {
                  name: DEFAULT_SPRINT.name,
                  goal: DEFAULT_SPRINT.goal,
                  status: DEFAULT_SPRINT.status,
                  isDefault: DEFAULT_SPRINT.isDefault,
                  createdBy: userId,
                  updatedBy: userId,
                },
              },
              members: {
                create: {
                  userId,
                  role: 'MANAGER',
                  createdBy: userId,
                  updatedBy: userId,
                },
              },
            },
            select: {
              id: true,
              slug: true,
              sprints: {
                select: {
                  id: true,
                  isDefault: true,
                },
              },
              workflow: {
                select: {
                  statuses: {
                    select: {
                      id: true,
                      name: true,
                    },
                    orderBy: { position: 'asc' },
                  },
                },
              },
            },
          });
        }

        // Create default tasks if project was created
        if (project) {
          const defaultSprint = project.sprints.find((s: { isDefault: boolean }) => s.isDefault);
          if (!project.workflow || project.workflow.statuses.length === 0) {
            throw new NotFoundException('Default workflow or statuses not found for the project');
          }
          const workflowStatuses = project.workflow.statuses;
          await tx.task.createMany({
            data: DEFAULT_TASKS.map((task, index) => {
              const status =
                workflowStatuses.find((s: { name: string }) => s.name === task.status) ??
                workflowStatuses[0];
              return {
                title: task.title,
                description: task.description,
                priority: task.priority,
                statusId: status.id,
                projectId: project.id,
                sprintId: defaultSprint?.id || null,
                taskNumber: index + 1,
                slug: `${project.slug}-${index + 1}`,
                createdBy: userId,
                updatedBy: userId,
              };
            }),
          });
        }

        return { organization, workspace, project };
      });

      const { organization } = result;

      // Log organization creation activity (outside transaction)
      await this.activityLog.logActivity({
        type: ActivityType.ORGANIZATION_CREATED,
        description: `Created organization "${organization.name}" (${organization.slug})`,
        entityType: 'Organization',
        entityId: organization.id,
        userId,
        organizationId: organization.id,
        newValue: {
          name: organization.name,
          slug: organization.slug,
          description: organization.description,
        },
      });

      return organization;
    } catch (error) {
      this.logger.error(`Error creating organization: ${error.message}`, error.stack);
      if (error.code === 'P2002') {
        throw new ConflictException('Organization with this slug already exists');
      }
      // Transaction automatically rolls back on error
      throw error;
    }
  }

  // Helper method to generate unique workspace slug
  private async generateUniqueWorkspaceSlug(name: string, organizationId: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    let slug = baseSlug;
    let counter = 1;
    const MAX_ITERATIONS = 100; // Prevent DoS attacks

    while (counter <= MAX_ITERATIONS) {
      const exists = await this.prisma.workspace.findFirst({
        where: { slug, organizationId },
      });

      if (!exists) break; // slug is available
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    if (counter > MAX_ITERATIONS) {
      this.logger.warn(
        `Failed to generate unique workspace slug for "${name}" after ${MAX_ITERATIONS} attempts`,
      );
      throw new ConflictException(
        `Unable to generate unique workspace slug. Please try a different name.`,
      );
    }

    return slug;
  }

  // Helper method to generate unique project slug
  private async generateUniqueProjectSlug(name: string, workspaceId: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    let slug = baseSlug;
    let counter = 1;
    const MAX_ITERATIONS = 100; // Prevent DoS attacks

    while (counter <= MAX_ITERATIONS) {
      const exists = await this.prisma.project.findFirst({
        where: { slug, workspaceId },
      });

      if (!exists) break; // slug is available
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    if (counter > MAX_ITERATIONS) {
      this.logger.warn(
        `Failed to generate unique project slug for "${name}" after ${MAX_ITERATIONS} attempts`,
      );
      throw new ConflictException(
        `Unable to generate unique project slug. Please try a different name.`,
      );
    }

    return slug;
  }

  private async createDefaultStatusTransitions(
    workflowId: string,
    statuses: any[],
    userId: string,
    tx?: Prisma.TransactionClient,
  ) {
    // Create a map of status names to IDs
    const statusMap = new Map(statuses.map((status) => [status.name, status.id]));

    const transitionsToCreate = DEFAULT_STATUS_TRANSITIONS.filter(
      (transition) => statusMap.has(transition.from) && statusMap.has(transition.to),
    ).map((transition) => ({
      name: `${transition.from} → ${transition.to}`,
      workflowId,
      fromStatusId: statusMap.get(transition.from),
      toStatusId: statusMap.get(transition.to),
      createdBy: userId,
      updatedBy: userId,
    }));

    if (transitionsToCreate.length > 0) {
      const prisma = tx || this.prisma;
      await prisma.statusTransition.createMany({
        data: transitionsToCreate,
      });
    }
  }
  // ... rest of your methods remain the same
  async findAll(userId: string): Promise<Organization[]> {
    // Get all organizations the user is a member of
    const userMemberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      select: { organizationId: true },
    });

    const organizationIds = userMemberships.map((m) => m.organizationId);

    // Return only organizations the user belongs to
    return this.prisma.organization.findMany({
      where: {
        archive: false,
        id: { in: organizationIds },
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
            workspaces: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string): Promise<Organization> {
    // Verify user has access to this organization
    await this.verifyOrganizationAccess(id, userId);

    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        workspaces: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            avatar: true,
            color: true,
            _count: {
              select: {
                projects: true,
                members: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            workspaces: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async findBySlug(slug: string, userId: string): Promise<Organization> {
    const organization = await this.prisma.organization.findUnique({
      where: { slug },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Verify user has access to this organization
    await this.verifyOrganizationAccess(organization.id, userId);

    const orgWithDetails = await this.prisma.organization.findUnique({
      where: { slug },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        workspaces: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            avatar: true,
            color: true,
            _count: {
              select: {
                projects: true,
                members: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            workspaces: true,
          },
        },
      },
    });

    if (!orgWithDetails) {
      throw new NotFoundException('Organization not found');
    }

    return orgWithDetails;
  }

  async update(
    id: string,
    updateOrganizationDto: UpdateOrganizationDto,
    userId: string,
  ): Promise<Organization> {
    try {
      // Verify user has MANAGER or OWNER role to update organization
      await this.verifyOrganizationAccess(id, userId, Role.MANAGER);

      // Get current organization to check what's changing
      const currentOrg = await this.prisma.organization.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          website: true,
          avatar: true,
        },
      });

      if (!currentOrg) {
        throw new NotFoundException('Organization not found');
      }

      let finalSlug: string | undefined;

      // Case 1: Slug is explicitly provided (user manually edited it)
      if (updateOrganizationDto.slug && updateOrganizationDto.slug !== currentOrg.slug) {
        // Check if the provided slug is unique (excluding current org)
        const slugExists = await this.prisma.organization.findFirst({
          where: {
            slug: updateOrganizationDto.slug,
            id: { not: id },
          },
          select: { id: true },
        });

        if (slugExists) {
          throw new ConflictException(
            `Slug "${updateOrganizationDto.slug}" is already taken. Please choose a different slug.`,
          );
        }

        finalSlug = updateOrganizationDto.slug;
      }
      // Case 2: Name is changed but slug is not provided (auto-generate slug)
      else if (
        updateOrganizationDto.name &&
        updateOrganizationDto.name !== currentOrg.name &&
        !updateOrganizationDto.slug
      ) {
        finalSlug = await this.generateUniqueSlug(updateOrganizationDto.name, id);
      }

      // Remove slug from DTO to avoid conflict with finalSlug
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { slug: _slug, ...dtoWithoutSlug } = updateOrganizationDto;

      const organization = await this.prisma.organization.update({
        where: { id },
        data: {
          ...dtoWithoutSlug,
          ...(finalSlug && { slug: finalSlug }), // Only update slug if changed
          updatedBy: userId,
        },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
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
              members: true,
              workspaces: true,
            },
          },
        },
      });

      // Build change summary for audit log
      const changes: Record<string, any> = {};
      if (updateOrganizationDto.name && updateOrganizationDto.name !== currentOrg.name) {
        changes.name = { old: currentOrg.name, new: updateOrganizationDto.name };
      }
      if (finalSlug && finalSlug !== currentOrg.slug) {
        changes.slug = { old: currentOrg.slug, new: finalSlug };
      }
      if (updateOrganizationDto.description !== undefined) {
        changes.description = {
          old: currentOrg.description,
          new: updateOrganizationDto.description,
        };
      }
      if (updateOrganizationDto.website !== undefined) {
        changes.website = { old: currentOrg.website, new: updateOrganizationDto.website };
      }
      if (updateOrganizationDto.avatar !== undefined) {
        changes.avatar = { old: currentOrg.avatar, new: updateOrganizationDto.avatar };
      }

      // Log organization update activity if there were changes
      if (Object.keys(changes).length > 0) {
        await this.activityLog.logActivity({
          type: ActivityType.ORGANIZATION_UPDATED,
          description: `Updated organization "${organization.name}"`,
          entityType: 'Organization',
          entityId: organization.id,
          userId,
          organizationId: organization.id,
          oldValue: changes,
        });
      }

      return organization;
    } catch (error) {
      this.logger.error(`Error updating organization: ${error.message}`, error.stack);
      if (error.code === 'P2002') {
        throw new ConflictException('Organization with this slug already exists');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Organization not found');
      }
      throw error;
    }
  }

  async remove(id: string, userId: string): Promise<Organization> {
    try {
      // Verify user has OWNER role to delete organization
      await this.verifyOrganizationAccess(id, userId, Role.OWNER);

      // Get organization details before deletion for audit log
      const organization = await this.prisma.organization.findUnique({
        where: { id },
        select: { id: true, name: true, slug: true },
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      // Clear defaultOrganizationId for users who had this as their default
      await this.prisma.user.updateMany({
        where: { defaultOrganizationId: id },
        data: { defaultOrganizationId: null },
      });

      // Clear global default_organization_id setting if it points to this org
      const defaultOrgSetting = await this.settingsService.get('default_organization_id');
      if (defaultOrgSetting === id) {
        await this.settingsService.set(
          'default_organization_id',
          '',
          undefined,
          undefined,
          'registration',
        );
      }

      const deletedOrg = await this.prisma.organization.delete({
        where: { id },
      });

      // Log organization deletion activity
      await this.activityLog.logActivity({
        type: ActivityType.ORGANIZATION_UPDATED,
        description: `Deleted organization "${organization.name}" (${organization.slug})`,
        entityType: 'Organization',
        entityId: organization.id,
        userId,
        oldValue: {
          name: organization.name,
          slug: organization.slug,
          deleted: true,
        },
      });

      return deletedOrg;
    } catch (error: any) {
      this.logger.error(`Error removing organization: ${error.message}`, error.stack);
      if (error.code === 'P2025') {
        throw new NotFoundException('Organization not found');
      }
      throw error;
    }
  }

  async getOrganizationStats(organizationId: string, userId: string) {
    // Verify user has at least VIEWER role to see organization stats
    await this.verifyOrganizationAccess(organizationId, userId, Role.VIEWER);

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, slug: true },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const activeProjects = await this.prisma.project.count({
      where: {
        workspace: {
          organizationId,
        },
        status: 'ACTIVE',
      },
    });

    const totalActiveWorkspaces = await this.prisma.workspace.count({
      where: {
        organizationId,
      },
    });

    const taskStats = await this.prisma.task.groupBy({
      by: ['statusId'],
      where: {
        project: {
          workspace: {
            organizationId,
          },
        },
      },
      _count: {
        id: true,
      },
    });

    const statusCategories = await this.prisma.taskStatus.findMany({
      where: {
        workflow: {
          organizationId,
        },
      },
      select: {
        id: true,
        category: true,
      },
    });

    const recentActivities = await this.prisma.activityLog.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
    });

    const statusCategoryMap = new Map(
      statusCategories.map((status) => [status.id, status.category]),
    );

    // Calculate task counts
    let totalTasks = 0;
    let openTasks = 0;
    let completedTasks = 0;

    taskStats.forEach((stat) => {
      const count = stat._count.id;
      totalTasks += count;

      const category = statusCategoryMap.get(stat.statusId);
      if (category === 'DONE') {
        completedTasks += count;
      } else {
        openTasks += count;
      }
    });

    return {
      organizationId: organization.id,
      organizationName: organization.name,
      organizationSlug: organization.slug,
      statistics: {
        totalTasks,
        openTasks,
        completedTasks,
        activeProjects,
        totalActiveWorkspaces,
      },
      recentActivities: recentActivities.map((activity) => ({
        id: activity.id,
        type: activity.type,
        description: activity.description,
        entityType: activity.entityType,
        entityId: activity.entityId,
        createdAt: activity.createdAt,
        user: {
          id: activity.user.id,
          name: `${activity.user.firstName} ${activity.user.lastName}`,
          email: activity.user.email,
          avatar: activity.user.avatar,
        },
      })),
    };
  }

  // Helper method to get default workflow for a project
  async getDefaultWorkflow(organizationId: string) {
    return await this.prisma.workflow.findFirst({
      where: {
        organizationId,
        isDefault: true,
      },
      include: {
        statuses: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async archiveOrganization(id: string, userId: string): Promise<void> {
    try {
      // Verify user has OWNER role to archive organization
      await this.verifyOrganizationAccess(id, userId, Role.OWNER);

      // Get organization details before archiving for audit log
      const organization = await this.prisma.organization.findUnique({
        where: { id },
        select: { id: true, name: true, slug: true, archive: true },
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      if (organization.archive) {
        throw new ConflictException('Organization is already archived');
      }

      await this.prisma.organization.update({
        where: { id },
        data: { archive: true },
      });

      // Log organization archive activity
      await this.activityLog.logActivity({
        type: ActivityType.ORGANIZATION_UPDATED,
        description: `Archived organization "${organization.name}" (${organization.slug})`,
        entityType: 'Organization',
        entityId: organization.id,
        userId,
        organizationId: id,
        oldValue: { archived: false },
        newValue: { archived: true },
      });
    } catch (error) {
      this.logger.error(`Error archiving organization: ${error.message}`, error.stack);
      if (error.code === 'P2025') {
        throw new NotFoundException('Organization not found');
      }
      throw error;
    }
  }
}
