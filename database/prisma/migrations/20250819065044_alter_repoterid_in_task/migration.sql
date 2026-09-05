-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_reporter_id_fkey";

-- AlterTable
ALTER TABLE "tasks" ALTER COLUMN "reporter_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
