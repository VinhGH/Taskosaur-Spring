/*
  Warnings:

  - The `role` column on the `organization_members` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `project_members` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `workspace_members` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'MANAGER', 'MEMBER', 'VIEWER');

-- AlterTable
ALTER TABLE "organization_members" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE "project_members" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'MEMBER';

-- AlterTable
ALTER TABLE "workspace_members" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'MEMBER';

-- DropEnum
DROP TYPE "OrganizationRole";

-- DropEnum
DROP TYPE "ProjectRole";

-- DropEnum
DROP TYPE "WorkspaceRole";
