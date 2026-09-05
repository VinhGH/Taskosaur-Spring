-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "list_rank" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "tasks_project_id_list_rank_idx" ON "tasks"("project_id", "list_rank");
