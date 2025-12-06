/**
 * API endpoint for recording supplier deliveries
 */

import { requireAdminAuth } from '@/lib/admin-auth';
import { trackSupplierDelivery } from '@/lib/inventory/tracking';
import { requireCsrfToken } from '@/lib/security/csrf';
import { getRateLimitConfig, withRateLimit } from '@/lib/security/rate-limit-wrapper';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

const supplierDeliverySchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  supplierId: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

async function handlePOST(request: NextRequest) {
  // Verify CSRF token
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const validation = supplierDeliverySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { productId, quantity, supplierId, notes } = validation.data;

    await trackSupplierDelivery(productId, quantity, supplierId, notes);

    return NextResponse.json({
      success: true,
      message: 'Supplier delivery recorded successfully',
    });
  } catch (error) {
    logError('Error recording supplier delivery:', error);
    return NextResponse.json(
      { error: 'Failed to record supplier delivery' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handlePOST, getRateLimitConfig('admin'));

