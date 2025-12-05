/**
 * Script to add slug column directly via SQL
 * Use this if Prisma migrate commands are timing out
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function addSlugColumn() {
  try {
    console.log('Checking if slug column exists...');
    
    // Check if column exists
    const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Product' AND column_name = 'slug'
      ) as exists
    `;

    if (result[0].exists) {
      console.log('✓ Slug column already exists');
      return;
    }

    console.log('Adding slug column...');

    // Add slug column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "slug" TEXT;
    `);

    // Create index
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "Product_slug_idx" ON "Product"("slug");
    `);

    // Set temporary slugs for existing products
    await prisma.$executeRawUnsafe(`
      UPDATE "Product" SET "slug" = 'product-' || "id"::text WHERE "slug" IS NULL;
    `);

    // Make slug unique and not null
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Product" ALTER COLUMN "slug" SET NOT NULL;
    `);

    // Add unique constraint (handle if it already exists)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Product" ADD CONSTRAINT "Product_slug_key" UNIQUE ("slug");
      `);
    } catch (error: any) {
      if (!error.message?.includes('already exists')) {
        throw error;
      }
    }

    console.log('✓ Slug column added successfully');
    console.log('✓ Temporary slugs set for existing products');
    console.log('\nNow run: npx tsx scripts/generate-product-slugs.ts');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addSlugColumn();

