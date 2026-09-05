/*
  Warnings:

  - You are about to drop the column `data` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `is_read` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `updated_by_id` on the `notifications` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_updated_by_id_fkey";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "data",
DROP COLUMN "is_read",
DROP COLUMN "updated_by_id",
ADD COLUMN     "action_url" TEXT,
ADD COLUMN     "entity_id" UUID,
ADD COLUMN     "entity_type" TEXT,
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "organization_id" UUID,
ADD COLUMN     "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "read_at" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
