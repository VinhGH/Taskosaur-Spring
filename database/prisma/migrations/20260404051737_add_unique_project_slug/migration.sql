/*
  Warnings:

  - A unique constraint covering the columns `[project_id,slug]` on the table `sprints` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "sprints" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "sprints_project_id_slug_key" ON "sprints"("project_id", "slug");
