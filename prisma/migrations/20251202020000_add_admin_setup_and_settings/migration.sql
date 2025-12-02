-- CreateTable (if not exists - table may have been created by earlier migration)
CREATE TABLE IF NOT EXISTS "SiteSetting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "company_name" TEXT NOT NULL DEFAULT 'Twines and Straps SA (Pty) Ltd',
    "tagline" TEXT NOT NULL DEFAULT 'Boundless Strength, Endless Solutions!',
    "email" TEXT NOT NULL DEFAULT 'admin@tassa.co.za',
    "phone" TEXT NOT NULL DEFAULT '+27 (0)63 969 0773',
    "whatsapp_number" TEXT NOT NULL DEFAULT '27639690773',
    "address" TEXT NOT NULL DEFAULT '',
    "business_hours" TEXT NOT NULL DEFAULT 'Mon-Fri 8:00-17:00',
    "vat_rate" TEXT NOT NULL DEFAULT '15',
    "logo_url" TEXT NOT NULL DEFAULT '',
    "social_facebook" TEXT NOT NULL DEFAULT '',
    "social_instagram" TEXT NOT NULL DEFAULT '',
    "social_linkedin" TEXT NOT NULL DEFAULT '',
    "social_twitter" TEXT NOT NULL DEFAULT '',
    "social_youtube" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- Add missing columns if they don't exist (for databases where table was created by earlier migration)
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "social_twitter" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SiteSetting" ADD COLUMN IF NOT EXISTS "social_youtube" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE IF NOT EXISTS "AdminSetupTask" (
    "id" SERIAL NOT NULL,
    "task_key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "link_url" TEXT,
    "link_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSetupTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AdminSetupTask_task_key_key" ON "AdminSetupTask"("task_key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AdminSetupTask_category_idx" ON "AdminSetupTask"("category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AdminSetupTask_completed_idx" ON "AdminSetupTask"("completed");
