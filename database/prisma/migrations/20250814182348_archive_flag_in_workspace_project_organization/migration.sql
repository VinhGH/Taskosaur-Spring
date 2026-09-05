-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "archive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "archive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "archive" BOOLEAN NOT NULL DEFAULT false;
