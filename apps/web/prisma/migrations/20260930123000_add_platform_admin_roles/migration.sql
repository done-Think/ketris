CREATE TYPE "PlatformAdminRole" AS ENUM ('ADMIN', 'ADMIN_AGENT', 'AGENT');

ALTER TABLE "platform_admins"
ADD COLUMN "role" "PlatformAdminRole" NOT NULL DEFAULT 'ADMIN';
