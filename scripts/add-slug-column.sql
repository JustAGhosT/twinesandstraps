-- Add slug column to Product table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' AND column_name = 'slug'
    ) THEN
        -- Add slug column
        ALTER TABLE "Product" ADD COLUMN "slug" TEXT;
        
        -- Create index on slug
        CREATE INDEX IF NOT EXISTS "Product_slug_idx" ON "Product"("slug");
        
        -- Set temporary slugs for existing products
        UPDATE "Product" SET "slug" = 'product-' || "id"::text WHERE "slug" IS NULL;
        
        -- Make slug unique and not null
        ALTER TABLE "Product" ALTER COLUMN "slug" SET NOT NULL;
        ALTER TABLE "Product" ADD CONSTRAINT "Product_slug_key" UNIQUE ("slug");
        
        RAISE NOTICE 'Slug column added successfully';
    ELSE
        RAISE NOTICE 'Slug column already exists';
    END IF;
END $$;

