/**
 * Cron job endpoint for cache warming
 * Should be called periodically to pre-fetch frequently accessed data
 */

import { NextRequest, NextResponse } from 'next/server';
import { warmCache } from '@/lib/cache/warm-cache';

export async function GET(request: NextRequest) {
  // Verify cron secret (if configured)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    await warmCache();

    return NextResponse.json({
      success: true,
      message: 'Cache warming completed',
    });
  } catch (error) {
    console.error('Error in cache warming cron:', error);
    return NextResponse.json(
      { error: 'Failed to warm cache' },
      { status: 500 }
    );
  }
}

