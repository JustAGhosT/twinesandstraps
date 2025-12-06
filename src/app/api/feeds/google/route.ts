/**
 * Google Shopping Product Feed (XML)
 * Endpoint: /api/feeds/google
 */

import { NextResponse } from 'next/server';
import { generateGoogleShoppingFeed } from '@/lib/marketplace/feeds';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  try {
    const feed = await generateGoogleShoppingFeed();

    return new NextResponse(feed, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    logError('Error generating Google Shopping feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate feed' },
      { status: 500 }
    );
  }
}

