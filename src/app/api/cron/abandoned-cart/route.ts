/**
 * Cron job endpoint for processing abandoned cart reminders
 * Should be called by a scheduled task (e.g., Vercel Cron, GitHub Actions, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { processAbandonedCartReminders } from '@/lib/abandoned-cart';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

// Optional: Add authentication to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify cron secret if configured
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const results = await processAbandonedCartReminders();

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError('Abandoned cart cron job error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

