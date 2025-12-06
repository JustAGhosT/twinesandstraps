/**
 * Admin API for quote management
 */

import { NextRequest, NextResponse } from 'next/server';
import { listQuotes } from '@/lib/quotes/quote-management';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const admin = await getAdminUser(request);
    // if (!admin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await listQuotes({
      status: status && status !== 'all' ? status : undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      quotes: result.quotes,
      total: result.total,
      hasMore: result.hasMore,
    });
  } catch (error) {
    logError('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

