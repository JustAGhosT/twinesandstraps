/**
 * Cron job endpoint for low stock alerts
 * Should be called daily (e.g., via Azure Functions, Vercel Cron, or similar)
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkAndSendLowStockAlerts } from '@/lib/inventory/low-stock';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

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
    const result = await checkAndSendLowStockAlerts();

    return NextResponse.json({
      success: result.success,
      alertSent: result.alertSent,
      productCount: result.productCount,
      message: result.alertSent
        ? `Low stock alert sent for ${result.productCount} product(s)`
        : result.productCount > 0
        ? `Low stock detected but alert not sent (${result.productCount} products)`
        : 'No low stock products found',
    });
  } catch (error) {
    logError('Error in low stock alert cron:', error);
    return NextResponse.json(
      { error: 'Failed to process low stock alert' },
      { status: 500 }
    );
  }
}

