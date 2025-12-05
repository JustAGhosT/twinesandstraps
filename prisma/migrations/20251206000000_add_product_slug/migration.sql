-- Add slug column to Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- Create index on slug
CREATE INDEX IF NOT EXISTS "Product_slug_idx" ON "Product"("slug");

-- Generate slugs for existing products
-- This will be done by a script after migration runs
-- For now, we'll set a temporary slug based on ID
UPDATE "Product" SET "slug" = 'product-' || "id"::text WHERE "slug" IS NULL;

-- Make slug unique and not null
ALTER TABLE "Product" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Product" ADD CONSTRAINT "Product_slug_key" UNIQUE ("slug");

