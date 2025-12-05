/**
 * Facebook Catalog Product Feed (JSON)
 * Endpoint: /api/feeds/facebook
 */

import { NextResponse } from 'next/server';
import { generateFacebookCatalogFeed } from '@/lib/marketplace/feeds';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  try {
    const feed = await generateFacebookCatalogFeed();

    return NextResponse.json(feed, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error generating Facebook catalog feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate feed' },
      { status: 500 }
    );
  }
}

