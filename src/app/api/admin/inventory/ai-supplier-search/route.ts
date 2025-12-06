/**
 * AI-Powered Supplier Search for Low Stock Items
 * POST: Search for suppliers when product is low on stock
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { requireCsrfToken } from '@/lib/security/csrf';
import { getRateLimitConfig, withRateLimit } from '@/lib/security/rate-limit-wrapper';
import { findSupplierForLowStock } from '@/lib/ai/inventory-optimization';
import { z } from 'zod';

const searchSchema = z.object({
  productId: z.number(),
  currentStock: z.number().optional(),
  minStockLevel: z.number().optional().default(10),
});

async function handlePOST(request: NextRequest) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const validation = searchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { productId, currentStock, minStockLevel } = validation.data;

    const results = await findSupplierForLowStock(
      productId,
      currentStock || 0,
      minStockLevel
    );

    return NextResponse.json({
      success: true,
      productId,
      suppliers: results,
      count: results.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handlePOST, getRateLimitConfig('admin'));

