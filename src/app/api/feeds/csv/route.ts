/**
 * CSV Product Feed (for Takealot, etc.)
 * Endpoint: /api/feeds/csv
 */

import { NextResponse } from 'next/server';
import { generateCSVFeed } from '@/lib/marketplace/feeds';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  try {
    const feed = await generateCSVFeed();

    return new NextResponse(feed, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="tassa-products.csv"',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error generating CSV feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate feed' },
      { status: 500 }
    );
  }
}

