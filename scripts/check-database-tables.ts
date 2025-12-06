/**
 * Script to check which tables exist in the database
 * Helps diagnose migration conflicts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTables() {
  try {
    console.log('Checking database tables...\n');
    
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    console.log(`Found ${tables.length} tables:\n`);
    tables.forEach(t => console.log(`  ✓ ${t.table_name}`));
    
    // Check specific tables we care about
    console.log('\nChecking specific tables:');
    
    const importantTables = ['User', 'Quote', 'UserConsent', 'Product', 'Order'];
    for (const tableName of importantTables) {
      const exists = tables.some(t => t.table_name === tableName);
      console.log(`  ${exists ? '✓' : '✗'} ${tableName}`);
    }
    
    // Check _prisma_migrations table
    console.log('\nChecking migration history:');
    try {
      const migrations = await prisma.$queryRaw<Array<{ migration_name: string; applied_steps_count: number }>>`
        SELECT migration_name, applied_steps_count
        FROM "_prisma_migrations"
        ORDER BY finished_at DESC
        LIMIT 10
      `;
      
      console.log(`  Found ${migrations.length} recorded migrations:\n`);
      migrations.forEach(m => {
        console.log(`  ✓ ${m.migration_name} (${m.applied_steps_count} steps)`);
      });
    } catch (error: any) {
      console.log(`  ⚠️  Could not read migration history: ${error.message}`);
    }
    
  } catch (error: any) {
    console.error('❌ Error checking database:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();

