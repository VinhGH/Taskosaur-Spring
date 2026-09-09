-- =========================================================
-- Performance Optimization Indexes
-- =========================================================

-- 1. Tasks Indexes (Kanban boards, filtering, sorting, sprint view)
CREATE INDEX IF NOT EXISTS "tasks_project_id_idx" ON "tasks"("project_id");
CREATE INDEX IF NOT EXISTS "tasks_project_id_status_id_idx" ON "tasks"("project_id", "status_id");
CREATE INDEX IF NOT EXISTS "tasks_project_id_created_at_idx" ON "tasks"("project_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "tasks_sprint_id_idx" ON "tasks"("sprint_id");
CREATE INDEX IF NOT EXISTS "tasks_slug_idx" ON "tasks"("slug");
CREATE INDEX IF NOT EXISTS "tasks_created_by_id_idx" ON "tasks"("created_by_id");
CREATE INDEX IF NOT EXISTS "tasks_is_archived_idx" ON "tasks"("is_archived");

-- 2. Notifications Indexes (User bell badge, unread counter, notification feed)
CREATE INDEX IF NOT EXISTS "notifications_user_id_is_read_created_at_idx" ON "notifications"("user_id", "is_read", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications"("user_id");

-- 3. Activity Logs Indexes (Audit trails, entity history, workspace feed)
CREATE INDEX IF NOT EXISTS "activity_logs_entity_type_entity_id_idx" ON "activity_logs"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "activity_logs_organization_id_created_at_idx" ON "activity_logs"("organization_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "activity_logs_created_at_idx" ON "activity_logs"("created_at" DESC);

-- 4. Membership Reverse Lookup Indexes (Finding all members by container ID)
CREATE INDEX IF NOT EXISTS "workspace_members_workspace_id_idx" ON "workspace_members"("workspace_id");
CREATE INDEX IF NOT EXISTS "project_members_project_id_idx" ON "project_members"("project_id");
CREATE INDEX IF NOT EXISTS "organization_members_organization_id_idx" ON "organization_members"("organization_id");

-- 5. Task Child Entities (Comments chronological order, assignees & reporters "My Tasks")
CREATE INDEX IF NOT EXISTS "task_comments_task_id_created_at_idx" ON "task_comments"("task_id", "created_at" ASC);
CREATE INDEX IF NOT EXISTS "task_assignees_user_id_idx" ON "task_assignees"("user_id");
CREATE INDEX IF NOT EXISTS "task_reporters_user_id_idx" ON "task_reporters"("user_id");

-- 6. Time Entries & Worklogs (Task worklog aggregates and user date reports)
CREATE INDEX IF NOT EXISTS "time_entries_task_id_idx" ON "time_entries"("task_id");
CREATE INDEX IF NOT EXISTS "time_entries_user_id_date_idx" ON "time_entries"("user_id", "date");

-- 7. Projects & Sprints (Workspace projects listing, active sprints)
CREATE INDEX IF NOT EXISTS "projects_workspace_id_idx" ON "projects"("workspace_id");
CREATE INDEX IF NOT EXISTS "sprints_project_id_archive_idx" ON "sprints"("project_id", "archive");

-- 8. Settings (User and global key lookups)
CREATE INDEX IF NOT EXISTS "settings_user_id_key_idx" ON "settings"("user_id", "key");
CREATE INDEX IF NOT EXISTS "settings_key_idx" ON "settings"("key");
