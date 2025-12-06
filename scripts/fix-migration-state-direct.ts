/**
 * Directly fix failed migration state in database
 * Since Quote tables exist, we'll mark the migration as applied
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMigrationState() {
  try {
    console.log('Checking migration state...\n');
    
    // Check if Quote tables exist
    const quoteTables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('Quote', 'QuoteItem', 'QuoteStatusHistory', 'QuoteAttachment')
      ORDER BY table_name
    `;
    
    if (quoteTables.length === 0) {
      console.log('❌ Quote tables do not exist. Cannot mark migration as applied.');
      process.exit(1);
    }
    
    console.log('✅ Quote tables exist:');
    quoteTables.forEach(t => console.log(`  - ${t.table_name}`));
    console.log('');
    
    // Check current migration state
    const migration = await prisma.$queryRaw<Array<{
      migration_name: string;
      started_at: Date | null;
      finished_at: Date | null;
      rolled_back_at: Date | null;
      applied_steps_count: number;
    }>>`
      SELECT 
        migration_name,
        started_at,
        finished_at,
        rolled_back_at,
        applied_steps_count
      FROM "_prisma_migrations"
      WHERE migration_name = '20251205212300_add_quote_model'
    `;
    
    if (migration.length === 0) {
      console.log('❌ Migration record not found in database');
      process.exit(1);
    }
    
    const m = migration[0];
    console.log('Current migration state:');
    console.log(`  Migration: ${m.migration_name}`);
    console.log(`  Started: ${m.started_at || 'Unknown'}`);
    console.log(`  Finished: ${m.finished_at ? 'Yes' : 'NO - This is the problem'}`);
    console.log(`  Rolled Back: ${m.rolled_back_at ? 'Yes' : 'No'}`);
    console.log(`  Applied Steps: ${m.applied_steps_count}`);
    console.log('');
    
    if (m.finished_at) {
      console.log('✅ Migration is already marked as finished. No action needed.');
      return;
    }
    
    // Fix the migration state
    console.log('Fixing migration state...');
    console.log('Marking migration as finished (since tables exist)...');
    
    // Option 1: Mark as rolled back first, then we can mark as applied via CLI
    if (!m.rolled_back_at) {
      await prisma.$executeRawUnsafe(`
        UPDATE "_prisma_migrations"
        SET rolled_back_at = NOW()
        WHERE migration_name = '20251205212300_add_quote_model'
          AND finished_at IS NULL
      `);
      console.log('✅ Marked migration as rolled back');
    }
    
    // Option 2: Directly mark as finished (more direct approach)
    // Since the tables exist, we can safely mark it as finished
    const finishedAt = m.started_at || new Date();
    
    await prisma.$executeRawUnsafe(`
      UPDATE "_prisma_migrations"
      SET 
        finished_at = NOW(),
        rolled_back_at = NULL,
        applied_steps_count = 1
      WHERE migration_name = '20251205212300_add_quote_model'
        AND finished_at IS NULL
    `);
    
    console.log('✅ Migration marked as finished');
    console.log('');
    console.log('Verifying...');
    
    const updated = await prisma.$queryRaw<Array<{
      migration_name: string;
      finished_at: Date | null;
    }>>`
      SELECT migration_name, finished_at
      FROM "_prisma_migrations"
      WHERE migration_name = '20251205212300_add_quote_model'
    `;
    
    if (updated[0].finished_at) {
      console.log('✅ Migration state fixed successfully!');
      console.log('');
      console.log('You can now run:');
      console.log('  npx dotenv-cli -e .env -- npx prisma migrate deploy');
    } else {
      console.log('⚠️  Migration state may need manual fixing');
    }
    
  } catch (error: any) {
    console.error('❌ Error fixing migration state:', error.message);
    console.error('');
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixMigrationState();

