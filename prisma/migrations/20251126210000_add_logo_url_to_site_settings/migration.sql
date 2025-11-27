-- CreateTable
CREATE TABLE IF NOT EXISTS "SiteSetting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "company_name" TEXT NOT NULL DEFAULT 'Twines and Straps SA (Pty) Ltd',
    "tagline" TEXT NOT NULL DEFAULT 'Boundless Strength, Endless Solutions!',
    "email" TEXT NOT NULL DEFAULT 'info@twinesandstraps.co.za',
    "phone" TEXT NOT NULL DEFAULT '+27 (0) 11 234 5678',
    "whatsapp_number" TEXT NOT NULL DEFAULT '27XXXXXXXXX',
    "address" TEXT NOT NULL DEFAULT '',
    "business_hours" TEXT NOT NULL DEFAULT 'Mon-Fri 8:00-17:00',
    "vat_rate" TEXT NOT NULL DEFAULT '15',
    "logo_url" TEXT NOT NULL DEFAULT '',
    "social_facebook" TEXT NOT NULL DEFAULT '',
    "social_instagram" TEXT NOT NULL DEFAULT '',
    "social_linkedin" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);
