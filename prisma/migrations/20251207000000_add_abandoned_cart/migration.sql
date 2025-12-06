-- CreateTable
CREATE TABLE "AbandonedCart" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "reminder_sent" INTEGER NOT NULL DEFAULT 0,
    "recovered" BOOLEAN NOT NULL DEFAULT false,
    "recovered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AbandonedCart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AbandonedCart_email_idx" ON "AbandonedCart"("email");

-- CreateIndex
CREATE INDEX "AbandonedCart_recovered_idx" ON "AbandonedCart"("recovered");

-- CreateIndex
CREATE INDEX "AbandonedCart_updated_at_idx" ON "AbandonedCart"("updated_at");

-- CreateIndex
CREATE INDEX "AbandonedCart_reminder_sent_updated_at_idx" ON "AbandonedCart"("reminder_sent", "updated_at");

