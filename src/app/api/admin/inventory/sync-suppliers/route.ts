/**
 * API endpoint to trigger supplier inventory sync
 */

import { requireAdminAuth } from '@/lib/admin-auth';
import { requireCsrfToken } from '@/lib/security/csrf';
import { getRateLimitConfig, withRateLimit } from '@/lib/security/rate-limit-wrapper';
import { syncAllSuppliers, syncSupplierProducts } from '@/lib/inventory/supplier-sync';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

const syncSchema = z.object({
  supplierId: z.number().int().positive().optional(),
});

async function handlePOST(request: NextRequest) {
  // Verify CSRF token
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  // Verify admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const validation = syncSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { supplierId } = validation.data;

    if (supplierId) {
      // Sync specific supplier (requires products data - placeholder for now)
      return NextResponse.json({
        success: false,
        error: 'Single supplier sync requires products data. Use sync all for automatic sync.',
      });
    } else {
      // Sync all suppliers
      const results = await syncAllSuppliers();

      return NextResponse.json({
        success: true,
        results,
        message: `Synced ${results.length} supplier(s)`,
      });
    }
  } catch (error: any) {
    logError('Error syncing suppliers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync suppliers' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handlePOST, getRateLimitConfig('admin'));

