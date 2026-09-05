-- CreateTable: task_assignees (explicit join table replacing implicit _TaskAssignees)
CREATE TABLE "task_assignees" (
    "task_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_assignees_pkey" PRIMARY KEY ("task_id","user_id")
);

-- CreateTable: task_reporters (explicit join table replacing implicit _TaskReporters)
CREATE TABLE "task_reporters" (
    "task_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_reporters_pkey" PRIMARY KEY ("task_id","user_id")
);

-- Migrate data from implicit tables to explicit tables
-- In Prisma implicit m2m, column A = first model alphabetically (Task), B = second (User)
INSERT INTO "task_assignees" ("task_id", "user_id", "created_at")
SELECT "A", "B", CURRENT_TIMESTAMP
FROM "_TaskAssignees"
ON CONFLICT DO NOTHING;

INSERT INTO "task_reporters" ("task_id", "user_id", "created_at")
SELECT "A", "B", CURRENT_TIMESTAMP
FROM "_TaskReporters"
ON CONFLICT DO NOTHING;

-- Drop old implicit tables
DROP TABLE "_TaskAssignees";
DROP TABLE "_TaskReporters";

-- AddForeignKey
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_reporters" ADD CONSTRAINT "task_reporters_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_reporters" ADD CONSTRAINT "task_reporters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
