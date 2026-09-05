/*
  Warnings:

  - You are about to drop the column `isDefault` on the `status_transitions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sprints" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "status_transitions" DROP COLUMN "isDefault";
