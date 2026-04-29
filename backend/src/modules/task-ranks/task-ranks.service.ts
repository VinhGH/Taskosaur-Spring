import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, ScopeType, ViewType } from '@prisma/client';
import { ReorderDto } from './dto/reorder.dto';

@Injectable()
export class TaskRanksService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return `This action returns all taskRanks`;
  }

  findOne(id: number) {
    return `This action returns a #${id} taskRank`;
  }

  remove(id: number) {
    return `This action removes a #${id} taskRank`;
  }

  /**
   * Computes a rank between two neighbors.
   * @param predecessorRank The rank of the task appearing BEFORE the drop point.
   * @param successorRank The rank of the task appearing AFTER the drop point.
   */
  private computeRank(predecessorRank: number | null, successorRank: number | null): number {
    if (predecessorRank === null && successorRank === null) return 1.0;
    if (predecessorRank === null) return successorRank! - 1.0; // dropped at absolute top
    if (successorRank === null) return predecessorRank + 1.0; // dropped at absolute bottom
    return (predecessorRank + successorRank) / 2.0;
  }

  private needsRebalance(
    afterRank: number | null,
    beforeRank: number | null,
    neighbor: number,
  ): boolean {
    // Check if the rank is too close to its neighbor
    const threshold = 0.0001;
    if (afterRank !== null && Math.abs(afterRank - neighbor) < threshold) return true;
    if (beforeRank !== null && Math.abs(beforeRank - neighbor) < threshold) return true;
    return false;
  }

  async rebalance(scopeType: ScopeType, scopeId: string, viewType: ViewType): Promise<void> {
    // Logic to fetch tasks in the specified scope and view, and rebalance their ranks
    const rows = await this.prisma.taskRank.findMany({
      where: {
        scopeType,
        scopeId,
        viewType,
      },
      orderBy: [
        { rank: 'asc' },
        { taskId: 'asc' }, // Secondary sort for absolute determinism
      ],
      select: {
        id: true,
      },
    });
    // const updates = rows.map((row, i) =>
    //   this.prisma.task.update({

    //   }),
    // );
    await this.prisma.$transaction(
      rows.map((row, i) =>
        this.prisma.taskRank.update({
          where: { id: row.id },
          data: { rank: i + 1 },
        }),
      ),
    );
  }

  async seedForTask(
    taskId: string,
    projectId: string,
    workspaceId: string,
    orgId: string,
    tx: Prisma.TransactionClient,
  ) {
    // Logic to insert 6 rank rows at bottom of each scope, accepts prisma transaction client
    const scopes = [
      { scopeType: ScopeType.PROJECT, scopeId: projectId },
      { scopeType: ScopeType.WORKSPACE, scopeId: workspaceId },
      { scopeType: ScopeType.ORGANIZATION, scopeId: orgId },
    ];

    const views = [ViewType.LIST, ViewType.GANTT];

    const existingMaxRanks = await tx.taskRank.groupBy({
      by: ['scopeType', 'scopeId', 'viewType'],
      where: {
        OR: scopes.flatMap((scope) =>
          views.map((view) => ({
            scopeType: scope.scopeType,
            scopeId: scope.scopeId,
            viewType: view,
          })),
        ),
      },
      _max: {
        rank: true,
      },
    });

    const maxRankMap = new Map(
      existingMaxRanks.map((r) => [`${r.scopeType}:${r.scopeId}:${r.viewType}`, r._max.rank ?? 0]),
    );

    const rows = scopes.flatMap(({ scopeType, scopeId }) =>
      views.map((viewType) => ({
        taskId,
        scopeType,
        scopeId,
        viewType,
        rank: (maxRankMap.get(`${scopeType}:${scopeId}:${viewType}`) ?? 0) + 1,
      })),
    );

    await tx.taskRank.createMany({
      data: rows,
    });
  }

  private async getNeighborRanks(
    scopeType: ScopeType,
    scopeId: string,
    viewType: ViewType,
    afterTaskId: string | null,
    beforeTaskId: string | null,
  ): Promise<{ afterRank: number | null; beforeRank: number | null }> {
    const [after, before] = await Promise.all([
      afterTaskId
        ? this.prisma.taskRank.findUnique({
            where: {
              taskId_scopeType_scopeId_viewType: {
                taskId: afterTaskId,
                scopeType,
                scopeId,
                viewType,
              },
            },
            select: { rank: true },
          })
        : null,
      beforeTaskId
        ? this.prisma.taskRank.findUnique({
            where: {
              taskId_scopeType_scopeId_viewType: {
                taskId: beforeTaskId,
                scopeType,
                scopeId,
                viewType,
              },
            },
            select: { rank: true },
          })
        : null,
    ]);

    let afterRank = after?.rank ?? null;
    let beforeRank = before?.rank ?? null;

    // Cross-page or boundary drops: If we only have one neighbor from the frontend,
    // find the true adjacent rank in the database to prevent pagination collisions.
    if (beforeRank !== null && afterRank === null) {
      const trueAfter = await this.prisma.taskRank.findFirst({
        where: { scopeType, scopeId, viewType, rank: { lt: beforeRank } },
        orderBy: [{ rank: 'desc' }, { taskId: 'desc' }],
        select: { rank: true },
      });
      if (trueAfter) afterRank = trueAfter.rank;
    } else if (afterRank !== null && beforeRank === null) {
      const trueBefore = await this.prisma.taskRank.findFirst({
        where: { scopeType, scopeId, viewType, rank: { gt: afterRank } },
        orderBy: [{ rank: 'asc' }, { taskId: 'asc' }],
        select: { rank: true },
      });
      if (trueBefore) beforeRank = trueBefore.rank;
    }

    return { afterRank, beforeRank };
  }

  async reorder({
    taskId,
    scopeType,
    scopeId,
    viewType,
    afterTaskId,
    beforeTaskId,
  }: ReorderDto & { taskId: string }) {
    const { afterRank, beforeRank } = await this.getNeighborRanks(
      scopeType,
      scopeId,
      viewType,
      afterTaskId,
      beforeTaskId,
    );

    const newRank = this.computeRank(afterRank, beforeRank);

    await this.prisma.taskRank.upsert({
      where: {
        taskId_scopeType_scopeId_viewType: {
          taskId,
          scopeType,
          scopeId,
          viewType,
        },
      },
      update: {
        rank: newRank,
      },
      create: {
        taskId,
        scopeType,
        scopeId,
        viewType,
        rank: newRank,
      },
    });

    if (this.needsRebalance(afterRank, beforeRank, newRank)) {
      await this.rebalance(scopeType, scopeId, viewType);
    }
  }
}
