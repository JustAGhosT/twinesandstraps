-- CreateTable
CREATE TABLE IF NOT EXISTS "UserConsent" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "marketing_consent" BOOLEAN NOT NULL DEFAULT false,
    "analytics_consent" BOOLEAN NOT NULL DEFAULT false,
    "functional_consent" BOOLEAN NOT NULL DEFAULT false,
    "consent_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserConsent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "UserConsent_user_id_key" ON "UserConsent"("user_id");

-- AddForeignKey
ALTER TABLE "UserConsent" ADD CONSTRAINT "UserConsent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

