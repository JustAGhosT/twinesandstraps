/**
 * Fix slug migrations that are failing because indexes/columns already exist
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSlugMigrations() {
  try {
    console.log('Checking slug migrations...\n');
    
    // Check if slug column exists
    const slugColumn = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Product' 
      AND column_name = 'slug'
    `;
    
    if (slugColumn.length === 0) {
      console.log('❌ Slug column does not exist. Migrations need to be applied.');
      process.exit(1);
    }
    
    console.log('✅ Slug column exists on Product table\n');
    
    // Check migration states
    const migrations = [
      '20251205214431_add_product_slug',
      '20251206000000_add_product_slug'
    ];
    
    for (const migrationName of migrations) {
      const migration = await prisma.$queryRawUnsafe<Array<{
        migration_name: string;
        finished_at: Date | null;
        rolled_back_at: Date | null;
      }>>(`
        SELECT migration_name, finished_at, rolled_back_at
        FROM "_prisma_migrations"
        WHERE migration_name = '${migrationName}'
      `);
      
      if (migration.length === 0) {
        console.log(`⚠️  Migration ${migrationName} not found in history`);
        continue;
      }
      
      const m = migration[0];
      
      if (m.finished_at) {
        console.log(`✅ ${migrationName} - Already applied`);
        continue;
      }
      
      console.log(`Fixing ${migrationName}...`);
      
      // Mark as finished since slug column exists
      await prisma.$executeRawUnsafe(`
        UPDATE "_prisma_migrations"
        SET 
          finished_at = NOW(),
          rolled_back_at = NULL,
          applied_steps_count = 1
        WHERE migration_name = '${migrationName}'
          AND finished_at IS NULL
      `);
      
      console.log(`✅ ${migrationName} - Marked as applied\n`);
    }
    
    console.log('✅ All slug migrations fixed!');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixSlugMigrations();

