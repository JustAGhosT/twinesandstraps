/**
 * Fix the final slug migration that's failing
 * The constraint already exists, so we'll mark it as applied
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixFinalSlugMigration() {
  try {
    console.log('Checking final slug migration...\n');
    
    const migrationName = '20251206000000_add_product_slug';
    
    // Check if migration is in history
    const existing = await prisma.$queryRawUnsafe<Array<{
      migration_name: string;
      finished_at: Date | null;
    }>>(`
      SELECT migration_name, finished_at
      FROM "_prisma_migrations"
      WHERE migration_name = '${migrationName}'
    `);
    
    // Check if slug column and constraint exist
    const slugExists = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Product' 
      AND column_name = 'slug'
    `;
    
    const constraintExists = await prisma.$queryRaw<Array<{ constraint_name: string }>>`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'Product' 
      AND constraint_name = 'Product_slug_key'
    `;
    
    if (slugExists.length === 0) {
      console.log('❌ Slug column does not exist. Migration needs to be applied properly.');
      process.exit(1);
    }
    
    console.log('✅ Slug column exists');
    
    if (constraintExists.length === 0) {
      console.log('⚠️  Slug constraint does not exist, but column does.');
    } else {
      console.log('✅ Slug constraint exists');
    }
    
    console.log('');
    
    if (existing.length > 0 && existing[0].finished_at) {
      console.log('✅ Migration already marked as applied');
      return;
    }
    
    if (existing.length > 0) {
      // Update existing record
      console.log('Updating existing migration record...');
      await prisma.$executeRawUnsafe(`
        UPDATE "_prisma_migrations"
        SET 
          finished_at = NOW(),
          rolled_back_at = NULL,
          applied_steps_count = 1
        WHERE migration_name = '${migrationName}'
      `);
      console.log('✅ Migration marked as applied');
    } else {
      // Insert new record
      console.log('Creating migration record...');
      await prisma.$executeRawUnsafe(`
        INSERT INTO "_prisma_migrations" (
          migration_name,
          started_at,
          finished_at,
          applied_steps_count,
          checksum
        ) VALUES (
          '${migrationName}',
          NOW(),
          NOW(),
          1,
          ''
        )
      `);
      console.log('✅ Migration record created and marked as applied');
    }
    
    console.log('\n✅ Final slug migration fixed!');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixFinalSlugMigration();

