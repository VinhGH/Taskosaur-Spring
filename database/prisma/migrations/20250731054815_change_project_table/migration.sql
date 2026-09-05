/*
  Warnings:

  - Made the column `avatar` on table `projects` required. This step will fail if there are existing NULL values in that column.
  - Made the column `color` on table `projects` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "projects" ALTER COLUMN "avatar" SET NOT NULL,
ALTER COLUMN "color" SET NOT NULL;
