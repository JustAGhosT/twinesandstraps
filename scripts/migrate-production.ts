/**
 * Production Migration Script
 * 
 * This script handles the scenario where the database already has tables
 * but the migration history is not properly synced. It baselines the
 * init migration if needed, then runs normal migrate deploy.
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
    const initMigrationApplied = await checkInitMigrationApplied();

    if (!initMigrationApplied) {
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

async function checkInitMigrationApplied(): Promise<boolean> {
  try {
    // Check if the _prisma_migrations table exists and has our init migration
    const result = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM "_prisma_migrations" 
      WHERE migration_name = ${INIT_MIGRATION_NAME}
    `;
    return Number(result[0].count) > 0;
  } catch {
    // Table doesn't exist or query failed - init migration not applied
    return false;
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
