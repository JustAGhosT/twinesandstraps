/**
 * API endpoint for inventory movement history
 */

import { requireAdminAuth } from '@/lib/admin-auth';
import { InventoryEventType, ReferenceType, getAllInventoryEvents, getProductInventoryHistory } from '@/lib/inventory/tracking';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const eventType = searchParams.get('eventType') as InventoryEventType | null;
    const referenceType = searchParams.get('referenceType') as ReferenceType | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // If productId is provided, get history for specific product
    if (productId) {
      const history = await getProductInventoryHistory(parseInt(productId), limit);
      return NextResponse.json({
        success: true,
        events: history,
        total: history.length,
      });
    }

    // Otherwise, get all events with filters
    const result = await getAllInventoryEvents({
      productId: productId ? parseInt(productId) : undefined,
      eventType: eventType || undefined,
      referenceType: referenceType || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error fetching inventory history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory history' },
      { status: 500 }
    );
  }
}

