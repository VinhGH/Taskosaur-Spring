/*
  Warnings:

  - The values [TASK_UPDATED,TASK_COMPLETED,SPRINT_STARTED,SPRINT_COMPLETED] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('TASK_ASSIGNED', 'TASK_STATUS_CHANGED', 'TASK_COMMENTED', 'TASK_DUE_SOON', 'PROJECT_CREATED', 'PROJECT_UPDATED', 'WORKSPACE_INVITED', 'MENTION', 'SYSTEM');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;
