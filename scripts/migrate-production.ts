/**
 * Production Migration Script
 * 
 * This script handles database migration scenarios where:
 * 1. The database already has tables but the migration history is not synced
 * 2. A previous migration attempt failed and left the database in an inconsistent state
 * 
 * It checks the init migration status and resolves issues before running migrate deploy:
 * - If init migration is not recorded but tables exist: baselines it as applied
 * - If init migration is marked as failed but tables exist: marks it as applied
 * - If init migration is marked as failed and tables don't exist: marks it as rolled back for retry
 * 
 * Usage: tsx scripts/migrate-production.ts
 */

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

// The init migration that creates the base tables (Product, Category, User)
const INIT_MIGRATION_NAME = '20251117010205_init';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting production migration...');

  try {
    // Check if the _prisma_migrations table exists and has the init migration
    const initMigrationStatus = await getInitMigrationStatus();

    if (initMigrationStatus === 'not_found') {
      console.log('Init migration not recorded. Checking if tables exist...');
      
      const tablesExist = await checkTablesExist();
      
      if (tablesExist) {
        console.log('Tables already exist. Baselining init migration...');
        
        // Mark the init migration as already applied
        execSync(`npx prisma migrate resolve --applied ${INIT_MIGRATION_NAME}`, {
          stdio: 'inherit',
        });
        
        console.log('Init migration baselined successfully.');
      }
    } else if (initMigrationStatus === 'failed') {
      console.log('Init migration is marked as failed. Checking if tables exist...');
      
      const tablesExist = await checkTablesExist();
      
      if (tablesExist) {
        console.log('Tables exist despite failed status. Marking migration as applied...');
        
        // Mark the failed migration as applied since the tables exist
        execSync(`npx prisma migrate resolve --applied ${INIT_MIGRATION_NAME}`, {
          stdio: 'inherit',
        });
        
        console.log('Failed migration marked as applied successfully.');
      } else {
        console.log('Tables do not exist. Marking migration as rolled back for retry...');
        
        // Mark the failed migration as rolled back so it can be retried
        execSync(`npx prisma migrate resolve --rolled-back ${INIT_MIGRATION_NAME}`, {
          stdio: 'inherit',
        });
        
        console.log('Failed migration marked as rolled back.');
      }
    } else {
      console.log('Init migration already recorded. Proceeding with normal deploy...');
    }

    // Now run the normal migrate deploy
    console.log('Running prisma migrate deploy...');
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
    });

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Represents a record from the Prisma _prisma_migrations table.
 * This table tracks the state of all applied migrations.
 */
interface MigrationRecord {
  /** The unique name of the migration (e.g., '20251117010205_init') */
  migration_name: string;
  /** Timestamp when the migration completed successfully. Null if migration is in progress or failed. */
  finished_at: Date | null;
  /** Timestamp when the migration was rolled back. Null if migration hasn't been rolled back. */
  rolled_back_at: Date | null;
}

async function getInitMigrationStatus(): Promise<'not_found' | 'applied' | 'failed'> {
  try {
    // Check if the _prisma_migrations table exists and has our init migration
    const result = await prisma.$queryRaw<MigrationRecord[]>`
      SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" 
      WHERE migration_name = ${INIT_MIGRATION_NAME}
    `;
    
    if (result.length === 0) {
      return 'not_found';
    }
    
    const migration = result[0];
    // Migration status is determined by the finished_at and rolled_back_at timestamps:
    // - finished_at=null, rolled_back_at=null: Migration started but never completed (failed)
    // - finished_at=set, rolled_back_at=null: Migration completed successfully (applied)
    // - rolled_back_at=set: Migration was rolled back (will be retried on next deploy)
    if (migration.finished_at === null && migration.rolled_back_at === null) {
      return 'failed';
    }
    
    return 'applied';
  } catch {
    // Table doesn't exist or query failed - init migration not applied
    return 'not_found';
  }
}

async function checkTablesExist(): Promise<boolean> {
  try {
    // Check if the Product table exists (which is created by init migration)
    // We check Product as a representative table - if it exists, the init migration
    // was already applied manually. The init migration creates Product, Category,
    // and User tables together, so checking one is sufficient.
    const result = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Product'
      ) as exists
    `;
    return result[0].exists;
  } catch {
    return false;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
