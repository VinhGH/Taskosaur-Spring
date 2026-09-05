/*
  Warnings:

  - A unique constraint covering the columns `[workflowId,name]` on the table `task_statuses` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "task_statuses_workflowId_key";

-- CreateIndex
CREATE UNIQUE INDEX "task_statuses_workflowId_name_key" ON "task_statuses"("workflowId", "name");
