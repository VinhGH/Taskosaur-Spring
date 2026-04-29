/*
  Warnings:

  - You are about to drop the column `display_order` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `list_rank` on the `tasks` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('IMAGE', 'DOCUMENT', 'VIDEO', 'OTHER');

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('ORGANIZATION', 'WORKSPACE', 'PROJECT');

-- CreateEnum
CREATE TYPE "ViewType" AS ENUM ('LIST', 'BOARD', 'GANTT');

-- DropIndex
DROP INDEX "tasks_project_id_list_rank_idx";

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "display_order",
DROP COLUMN "list_rank";

-- CreateTable
CREATE TABLE "task_ranks" (
    "id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "scope_type" "ScopeType" NOT NULL,
    "scope_id" UUID NOT NULL,
    "view_type" "ViewType" NOT NULL,
    "rank" DOUBLE PRECISION,

    CONSTRAINT "task_ranks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_ranks_scope_type_scope_id_view_type_rank_idx" ON "task_ranks"("scope_type", "scope_id", "view_type", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "task_ranks_task_id_scope_type_scope_id_view_type_key" ON "task_ranks"("task_id", "scope_type", "scope_id", "view_type");

-- AddForeignKey
ALTER TABLE "task_ranks" ADD CONSTRAINT "task_ranks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
