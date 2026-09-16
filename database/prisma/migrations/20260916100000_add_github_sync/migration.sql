-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "github_issue_id" TEXT,
ADD COLUMN "github_issue_number" INTEGER,
ADD COLUMN "github_issue_url" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tasks_github_issue_id_key" ON "tasks"("github_issue_id");

-- CreateTable
CREATE TABLE "github_syncs" (
    "id" UUID NOT NULL,
    "project_id" UUID,
    "workspace_id" UUID,
    "github_repo_owner" TEXT NOT NULL,
    "github_repo_name" TEXT NOT NULL,
    "github_repo_id" TEXT,
    "github_token" TEXT NOT NULL,
    "sync_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sync_interval" INTEGER NOT NULL DEFAULT 15,
    "sync_direction" TEXT NOT NULL DEFAULT 'ONE_WAY_IMPORT',
    "last_sync_at" TIMESTAMP(3),
    "last_sync_status" "SyncStatus",
    "last_sync_error" TEXT,
    "issues_imported" INTEGER NOT NULL DEFAULT 0,
    "status_mappings" JSONB,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_syncs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "github_syncs_project_id_key" ON "github_syncs"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "github_syncs_workspace_id_key" ON "github_syncs"("workspace_id");

-- CreateIndex
CREATE INDEX "github_syncs_workspace_id_idx" ON "github_syncs"("workspace_id");

-- AddForeignKey
ALTER TABLE "github_syncs" ADD CONSTRAINT "github_syncs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_syncs" ADD CONSTRAINT "github_syncs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_syncs" ADD CONSTRAINT "github_syncs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_syncs" ADD CONSTRAINT "github_syncs_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
