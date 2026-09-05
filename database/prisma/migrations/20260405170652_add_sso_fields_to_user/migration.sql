-- AlterTable
ALTER TABLE "users" ADD COLUMN "external_id" TEXT;
ALTER TABLE "users" ADD COLUMN "external_provider" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_external_id_key" ON "users"("external_id");
