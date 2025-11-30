-- CreateTable
CREATE TABLE "Supplier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "contact_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "default_markup" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "payment_terms" TEXT,
    "lead_time_days" INTEGER,
    "min_order_value" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImportBatch" (
    "id" SERIAL NOT NULL,
    "supplier_id" INTEGER,
    "filename" TEXT,
    "source" TEXT NOT NULL,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "processed_rows" INTEGER NOT NULL DEFAULT 0,
    "successful" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error_log" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "ProductImportBatch_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add 3rd party product fields to Product
ALTER TABLE "Product" ADD COLUMN "is_third_party" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "supplier_id" INTEGER;
ALTER TABLE "Product" ADD COLUMN "supplier_sku" TEXT;
ALTER TABLE "Product" ADD COLUMN "supplier_price" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN "markup_percentage" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN "last_synced_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");

-- CreateIndex
CREATE INDEX "Supplier_is_active_idx" ON "Supplier"("is_active");

-- CreateIndex
CREATE INDEX "Supplier_code_idx" ON "Supplier"("code");

-- CreateIndex
CREATE INDEX "ProductImportBatch_status_idx" ON "ProductImportBatch"("status");

-- CreateIndex
CREATE INDEX "ProductImportBatch_supplier_id_idx" ON "ProductImportBatch"("supplier_id");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
