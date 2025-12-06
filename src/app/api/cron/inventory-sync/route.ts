/**
 * Cron endpoint for daily inventory sync with suppliers
 * Should be called daily via Azure Functions or scheduled job
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncAllSuppliers } from '@/lib/inventory/supplier-sync';
import { trackEvent } from '@/lib/monitoring/app-insights';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (!CRON_SECRET || providedSecret !== CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Track sync start
    trackEvent('InventorySyncStarted', {
      timestamp: new Date().toISOString(),
    });

    // Sync all active suppliers
    const results = await syncAllSuppliers();

    const totalUpdated = results.reduce((sum, r) => sum + r.productsUpdated, 0);
    const totalCreated = results.reduce((sum, r) => sum + r.productsCreated, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    // Track sync completion
    trackEvent('InventorySyncCompleted', {
      suppliersCount: results.length,
      productsUpdated: totalUpdated,
      productsCreated: totalCreated,
      errors: totalErrors,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        suppliersSynced: results.length,
        productsUpdated: totalUpdated,
        productsCreated: totalCreated,
        errors: totalErrors,
      },
      details: results,
    });
  } catch (error: any) {
    logError('Error in inventory sync cron:', error);
    
    trackEvent('InventorySyncFailed', {
      error: error.message,
    });

    return NextResponse.json(
      { error: error.message || 'Failed to sync inventory' },
      { status: 500 }
    );
  }
}

