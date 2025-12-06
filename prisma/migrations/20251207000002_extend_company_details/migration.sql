-- Add company registration and legal details to SiteSetting
ALTER TABLE "SiteSetting" 
ADD COLUMN IF NOT EXISTS "company_registration_number" TEXT,
ADD COLUMN IF NOT EXISTS "tax_number" TEXT,
ADD COLUMN IF NOT EXISTS "vat_number" TEXT,
ADD COLUMN IF NOT EXISTS "bbbee_level" TEXT,
ADD COLUMN IF NOT EXISTS "physical_address" TEXT,
ADD COLUMN IF NOT EXISTS "postal_address" TEXT,
ADD COLUMN IF NOT EXISTS "postal_code" TEXT,
ADD COLUMN IF NOT EXISTS "city" TEXT,
ADD COLUMN IF NOT EXISTS "province" TEXT,
ADD COLUMN IF NOT EXISTS "country" TEXT DEFAULT 'South Africa',
ADD COLUMN IF NOT EXISTS "bank_name" TEXT,
ADD COLUMN IF NOT EXISTS "bank_account_number" TEXT,
ADD COLUMN IF NOT EXISTS "bank_account_type" TEXT,
ADD COLUMN IF NOT EXISTS "branch_code" TEXT;

-- Add provider fields to Supplier
ALTER TABLE "Supplier"
ADD COLUMN IF NOT EXISTS "provider_type" TEXT,
ADD COLUMN IF NOT EXISTS "provider_config" JSONB;

CREATE INDEX IF NOT EXISTS "Supplier_provider_type_idx" ON "Supplier"("provider_type");

-- Create ProductIntegration table
CREATE TABLE IF NOT EXISTS "ProductIntegration" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "integration_type" TEXT NOT NULL,
    "integration_id" INTEGER NOT NULL,
    "integration_name" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "price_override" DOUBLE PRECISION,
    "margin_percentage" DOUBLE PRECISION,
    "min_price" DOUBLE PRECISION,
    "max_price" DOUBLE PRECISION,
    "quantity_override" INTEGER,
    "min_quantity" INTEGER,
    "max_quantity" INTEGER,
    "reserve_quantity" INTEGER NOT NULL DEFAULT 0,
    "lead_time_days" INTEGER,
    "sync_schedule" TEXT,
    "last_synced_at" TIMESTAMP(3),
    "next_sync_at" TIMESTAMP(3),
    "auto_sync" BOOLEAN NOT NULL DEFAULT true,
    "sync_on_price_change" BOOLEAN NOT NULL DEFAULT true,
    "sync_on_stock_change" BOOLEAN NOT NULL DEFAULT true,
    "custom_config" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductIntegration_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "ProductIntegration_product_id_integration_type_integration_id_key" 
ON "ProductIntegration"("product_id", "integration_type", "integration_id");

-- Create indexes
CREATE INDEX IF NOT EXISTS "ProductIntegration_product_id_idx" ON "ProductIntegration"("product_id");
CREATE INDEX IF NOT EXISTS "ProductIntegration_integration_type_idx" ON "ProductIntegration"("integration_type");
CREATE INDEX IF NOT EXISTS "ProductIntegration_integration_id_idx" ON "ProductIntegration"("integration_id");
CREATE INDEX IF NOT EXISTS "ProductIntegration_is_enabled_idx" ON "ProductIntegration"("is_enabled");
CREATE INDEX IF NOT EXISTS "ProductIntegration_is_active_idx" ON "ProductIntegration"("is_active");
CREATE INDEX IF NOT EXISTS "ProductIntegration_next_sync_at_idx" ON "ProductIntegration"("next_sync_at");

-- Add foreign key
ALTER TABLE "ProductIntegration" 
ADD CONSTRAINT "ProductIntegration_product_id_fkey" 
FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

