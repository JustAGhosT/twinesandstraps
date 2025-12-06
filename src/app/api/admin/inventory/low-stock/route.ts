/**
 * API endpoint for low stock products
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { getLowStockProducts } from '@/lib/inventory/low-stock';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const alert = await getLowStockProducts();

    return NextResponse.json({
      success: true,
      ...alert,
    });
  } catch (error) {
    logError('Error fetching low stock products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch low stock products' },
      { status: 500 }
    );
  }
}

