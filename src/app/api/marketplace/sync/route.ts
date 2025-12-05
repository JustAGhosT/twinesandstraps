/**
 * Marketplace Inventory Sync API
 * Syncs inventory to external marketplaces
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncInventoryToChannel, getProductsNeedingSync } from '@/lib/marketplace/inventory';
import { syncInventoryToTakealot, isTakealotConfigured } from '@/lib/marketplace/takealot';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check

    const body = await request.json();
    const { channel, productId, quantity } = body;

    if (!channel || !productId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: channel, productId, quantity' },
        { status: 400 }
      );
    }

    let result;

    if (channel === 'TAKEALOT' && isTakealotConfigured()) {
      // Use Takealot-specific sync
      const success = await syncInventoryToTakealot(productId.toString(), quantity);
      result = {
        success,
        syncedAt: new Date(),
      };
    } else {
      // Use generic channel sync
      result = await syncInventoryToChannel(productId, channel, quantity);
    }

    return NextResponse.json({
      success: result.status === 'success' || result.success,
      result,
    });
  } catch (error) {
    console.error('Error syncing inventory:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get products that need sync
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel') || 'TAKEALOT';

    const productIds = await getProductsNeedingSync(channel);

    return NextResponse.json({
      success: true,
      productIds,
      count: productIds.length,
    });
  } catch (error) {
    console.error('Error getting products needing sync:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

