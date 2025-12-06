/**
 * Script to directly apply UserConsent migration
 * This bypasses Prisma's migration system for a one-time application
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function applyUserConsentMigration() {
  try {
    console.log('Reading migration SQL...');
    const migrationPath = path.join(
      process.cwd(),
      'prisma',
      'migrations',
      '20250107000000_add_user_consent',
      'migration.sql'
    );

    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('Checking if UserConsent table exists...');
    
    // Check if table exists
    const tableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'UserConsent'
      ) as exists
    `;

    if (tableExists[0].exists) {
      console.log('✅ UserConsent table already exists. Skipping migration.');
      return;
    }

    console.log('Applying migration SQL...');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await prisma.$executeRawUnsafe(statement);
      }
    }

    console.log('✅ UserConsent table created successfully!');
    console.log('');
    console.log('Next step: Mark the migration as applied in Prisma:');
    console.log('  npx dotenv-cli -e .env -- npx prisma migrate resolve --applied 20250107000000_add_user_consent');
    
  } catch (error: any) {
    console.error('❌ Error applying migration:', error.message);
    
    if (error.message?.includes('already exists')) {
      console.log('');
      console.log('The table already exists. Marking migration as applied...');
      console.log('Run: npx dotenv-cli -e .env -- npx prisma migrate resolve --applied 20250107000000_add_user_consent');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyUserConsentMigration();

