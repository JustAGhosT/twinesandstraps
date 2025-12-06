/**
 * AI-Powered Stock Offset Methods for Excess Inventory
 * POST: Find methods to reduce excess stock
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { requireCsrfToken } from '@/lib/security/csrf';
import { getRateLimitConfig, withRateLimit } from '@/lib/security/rate-limit-wrapper';
import { findOffsetMethodsForExcessStock } from '@/lib/ai/inventory-optimization';
import { z } from 'zod';

const offsetSchema = z.object({
  productId: z.number(),
  currentStock: z.number(),
  averageMonthlySales: z.number().optional(),
});

async function handlePOST(request: NextRequest) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const validation = offsetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { productId, currentStock, averageMonthlySales } = validation.data;

    const methods = await findOffsetMethodsForExcessStock(
      productId,
      currentStock,
      averageMonthlySales
    );

    return NextResponse.json({
      success: true,
      productId,
      methods,
      count: methods.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleGET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const currentStock = searchParams.get('currentStock');
    const averageMonthlySales = searchParams.get('averageMonthlySales');

    if (!productId || !currentStock) {
      return NextResponse.json(
        { error: 'productId and currentStock are required' },
        { status: 400 }
      );
    }

    const methods = await findOffsetMethodsForExcessStock(
      parseInt(productId),
      parseInt(currentStock),
      averageMonthlySales ? parseInt(averageMonthlySales) : undefined
    );

    return NextResponse.json({
      success: true,
      productId: parseInt(productId),
      methods,
      count: methods.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(handleGET, getRateLimitConfig('admin'));
export const POST = withRateLimit(handlePOST, getRateLimitConfig('admin'));

