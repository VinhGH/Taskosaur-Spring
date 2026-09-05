-- Step 1: Add new role column with Role enum type
ALTER TABLE "users" ADD COLUMN "role_new" "Role" DEFAULT 'MEMBER';

-- Step 2: Migrate existing UserRole values to Role values
UPDATE "users" 
SET "role_new" = CASE 
    WHEN "role"::text = 'SUPER_ADMIN' THEN 'SUPER_ADMIN'
    WHEN "role"::text = 'ADMIN' THEN 'SUPER_ADMIN'  -- Map ADMIN to SUPER_ADMIN
    WHEN "role"::text = 'MANAGER' THEN 'MANAGER'
    WHEN "role"::text = 'MEMBER' THEN 'MEMBER'
    WHEN "role"::text = 'VIEWER' THEN 'VIEWER'
    ELSE 'MEMBER'  -- Default fallback
END::"Role";

-- Step 3: Drop old role column and rename new one
ALTER TABLE "users" DROP COLUMN "role";
ALTER TABLE "users" RENAME COLUMN "role_new" TO "role";

-- Step 4: Set NOT NULL constraint for role column
ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;

-- Step 5: Drop old UserRole enum
DROP TYPE "UserRole";