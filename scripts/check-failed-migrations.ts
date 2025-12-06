/**
 * Check and resolve failed migrations
 * Connects to database and checks migration state
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkFailedMigrations() {
  try {
    console.log('Checking migration state...\n');
    
    // Check _prisma_migrations table for failed migrations
    const failedMigrations = await prisma.$queryRaw<Array<{
      migration_name: string;
      started_at: Date | null;
      finished_at: Date | null;
      applied_steps_count: number;
      rolled_back_at: Date | null;
    }>>`
      SELECT 
        migration_name,
        started_at,
        finished_at,
        applied_steps_count,
        rolled_back_at
      FROM "_prisma_migrations"
      WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL
      ORDER BY started_at DESC
    `;
    
    if (failedMigrations.length === 0) {
      console.log('✅ No failed migrations found');
      
      // Check all migrations
      const allMigrations = await prisma.$queryRaw<Array<{
        migration_name: string;
        started_at: Date | null;
        finished_at: Date | null;
      }>>`
        SELECT migration_name, started_at, finished_at
        FROM "_prisma_migrations"
        ORDER BY started_at DESC
        LIMIT 10
      `;
      
      console.log(`\nRecent migrations (${allMigrations.length}):`);
      allMigrations.forEach(m => {
        const status = m.finished_at ? '✅ Applied' : m.started_at ? '⚠️  In Progress' : '⏳ Pending';
        console.log(`  ${status} - ${m.migration_name}`);
      });
      
    } else {
      console.log(`⚠️  Found ${failedMigrations.length} failed/incomplete migration(s):\n`);
      
      failedMigrations.forEach(m => {
        console.log(`Migration: ${m.migration_name}`);
        console.log(`  Started: ${m.started_at || 'Unknown'}`);
        console.log(`  Finished: ${m.finished_at || 'NOT FINISHED'}`);
        console.log(`  Rolled Back: ${m.rolled_back_at || 'No'}`);
        console.log(`  Applied Steps: ${m.applied_steps_count}`);
        console.log('');
      });
      
      // Check if Quote tables exist
      console.log('Checking if Quote tables exist...\n');
      
      const quoteTables = await prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('Quote', 'QuoteItem', 'QuoteStatusHistory', 'QuoteAttachment')
        ORDER BY table_name
      `;
      
      if (quoteTables.length > 0) {
        console.log('✅ Quote tables exist:');
        quoteTables.forEach(t => console.log(`  - ${t.table_name}`));
        console.log('\n💡 Recommendation: Mark migration as rolled back, then as applied');
      } else {
        console.log('❌ Quote tables do not exist');
        console.log('\n💡 Recommendation: You may need to apply the migration or mark as rolled back');
      }
    }
    
    // Check for the specific failed migration
    const quoteMigration = await prisma.$queryRaw<Array<{
      migration_name: string;
      started_at: Date | null;
      finished_at: Date | null;
      rolled_back_at: Date | null;
    }>>`
      SELECT migration_name, started_at, finished_at, rolled_back_at
      FROM "_prisma_migrations"
      WHERE migration_name = '20251205212300_add_quote_model'
    `;
    
    if (quoteMigration.length > 0) {
      const m = quoteMigration[0];
      console.log('\n=== Quote Migration Status ===');
      console.log(`Migration: ${m.migration_name}`);
      console.log(`Started: ${m.started_at || 'Unknown'}`);
      console.log(`Finished: ${m.finished_at ? 'Yes' : 'NO - This is the problem!'}`);
      console.log(`Rolled Back: ${m.rolled_back_at ? 'Yes' : 'No'}`);
      
      if (!m.finished_at && !m.rolled_back_at) {
        console.log('\n🔧 Action Required:');
        console.log('This migration is in a failed state. Resolve it with:');
        console.log('  npx dotenv-cli -e .env -- npx prisma migrate resolve --rolled-back 20251205212300_add_quote_model');
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkFailedMigrations();

