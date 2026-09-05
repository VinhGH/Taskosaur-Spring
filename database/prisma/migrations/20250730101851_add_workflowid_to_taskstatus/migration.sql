/*
  Warnings:

  - You are about to drop the column `created_at` on the `task_statuses` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `task_statuses` table. All the data in the column will be lost.
  - You are about to drop the column `workflow_id` on the `task_statuses` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[workflowId]` on the table `task_statuses` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `task_statuses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workflowId` to the `task_statuses` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "task_statuses" DROP CONSTRAINT "task_statuses_workflow_id_fkey";

-- DropIndex
DROP INDEX "task_statuses_workflow_id_name_key";

-- AlterTable
ALTER TABLE "task_statuses" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
DROP COLUMN "workflow_id",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "workflowId" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "task_statuses_workflowId_key" ON "task_statuses"("workflowId");

-- AddForeignKey
ALTER TABLE "task_statuses" ADD CONSTRAINT "task_statuses_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;
