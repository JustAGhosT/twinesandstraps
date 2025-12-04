/**
 * Production Migration Script
 * 
 * This script handles database migration scenarios where:
 * 1. The database already has tables but the migration history is not synced
 * 2. A previous migration attempt failed and left the database in an inconsistent state
 * 
 * It resolves failed migrations before running migrate deploy:
 * - If init migration is not recorded but tables exist: baselines it as applied
 * - If any migration is marked as failed: marks it as rolled back for retry
 * 
 * Usage: tsx scripts/migrate-production.ts [--schema=path/to/schema.prisma]
 */

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

// The init migration that creates the base tables (Product, Category, User)
const INIT_MIGRATION_NAME = '20251203031247_init';

// Parse command line arguments for schema path
const schemaArg = process.argv.find(arg => arg.startsWith('--schema='));
const schemaPath = schemaArg ? schemaArg.split('=')[1] : null;
const schemaOption = schemaPath ? ` --schema=${schemaPath}` : '';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting production migration...');
  if (schemaPath) {
    console.log(`Using schema: ${schemaPath}`);
  }

  try {
    // First, check if we need to baseline the init migration
    const initMigrationStatus = await getInitMigrationStatus();

    if (initMigrationStatus === 'not_found') {
      console.log('Init migration not recorded. Checking if tables exist...');
      
      const tablesExist = await checkTablesExist();
      
      if (tablesExist) {
        console.log('Tables already exist. Baselining init migration...');
        
        // Mark the init migration as already applied
        execSync(`npx prisma migrate resolve --applied ${INIT_MIGRATION_NAME}${schemaOption}`, {
          stdio: 'inherit',
        });
        
        console.log('Init migration baselined successfully.');
      }
    } else if (initMigrationStatus === 'failed') {
      console.log('Init migration is marked as failed. Checking if tables exist...');
      
      const tablesExist = await checkTablesExist();
      
      if (tablesExist) {
        console.log('Tables exist despite failed status. Marking init migration as applied...');
        
        // Mark the failed init migration as applied since the tables exist
        execSync(`npx prisma migrate resolve --applied ${INIT_MIGRATION_NAME}${schemaOption}`, {
          stdio: 'inherit',
        });
        
        console.log('Failed init migration marked as applied successfully.');
      } else {
        console.log('Tables do not exist. Marking init migration as rolled back for retry...');
        
        // Mark the failed init migration as rolled back so it can be retried
        execSync(`npx prisma migrate resolve --rolled-back ${INIT_MIGRATION_NAME}${schemaOption}`, {
          stdio: 'inherit',
        });
        
        console.log('Failed init migration marked as rolled back.');
      }
    }

    // Then, check for ANY other failed migrations and mark them as rolled back for retry
    // (excluding init which was already handled above)
    const failedMigrations = await getFailedMigrations();
    
    if (failedMigrations.length > 0) {
      console.log(`Found ${failedMigrations.length} failed migration(s). Marking as rolled back for retry...`);
      
      for (const migrationName of failedMigrations) {
        console.log(`  Marking migration as rolled back: ${migrationName}`);
        execSync(`npx prisma migrate resolve --rolled-back ${migrationName}${schemaOption}`, {
          stdio: 'inherit',
        });
      }
      
      console.log('Failed migrations marked as rolled back successfully.');
    }

    // Now run the normal migrate deploy
    console.log('Running prisma migrate deploy...');
    execSync(`npx prisma migrate deploy${schemaOption}`, {
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

/**
 * Gets all failed migrations from the _prisma_migrations table,
 * excluding the init migration which is handled separately.
 * A migration is considered "failed" if:
 * - It has a record in the table
 * - finished_at is null (never completed successfully)
 * - rolled_back_at is null (hasn't been marked for rollback yet)
 */
async function getFailedMigrations(): Promise<string[]> {
  try {
    const result = await prisma.$queryRaw<MigrationRecord[]>`
      SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" 
      WHERE finished_at IS NULL 
        AND rolled_back_at IS NULL
        AND migration_name != ${INIT_MIGRATION_NAME}
    `;
    
    return result.map((r: MigrationRecord) => r.migration_name);
  } catch {
    // Table doesn't exist or query failed - no failed migrations to recover
    return [];
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
