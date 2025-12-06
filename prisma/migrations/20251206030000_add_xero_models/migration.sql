-- CreateTable
CREATE TABLE IF NOT EXISTS "XeroToken" (
    "id" SERIAL NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL,
    "tenant_id" TEXT,
    "tenant_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_refreshed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "XeroToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "XeroToken_expires_at_idx" ON "XeroToken"("expires_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "XeroToken_is_active_idx" ON "XeroToken"("is_active");

-- CreateTable
CREATE TABLE IF NOT EXISTS "XeroInvoiceMapping" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "xero_invoice_id" TEXT NOT NULL,
    "xero_invoice_number" TEXT,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "XeroInvoiceMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "XeroInvoiceMapping_order_id_key" ON "XeroInvoiceMapping"("order_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "XeroInvoiceMapping_xero_invoice_id_idx" ON "XeroInvoiceMapping"("xero_invoice_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "XeroInvoiceMapping_order_id_idx" ON "XeroInvoiceMapping"("order_id");

-- AddForeignKey
ALTER TABLE "XeroInvoiceMapping" ADD CONSTRAINT "XeroInvoiceMapping_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

