-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_status_id_fkey";

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "task_statuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
