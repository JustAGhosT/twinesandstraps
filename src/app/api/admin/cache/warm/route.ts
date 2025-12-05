/**
 * API endpoint to manually trigger cache warming
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { warmCache } from '@/lib/cache/warm-cache';

export async function POST(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    await warmCache();

    return NextResponse.json({
      success: true,
      message: 'Cache warming completed',
    });
  } catch (error) {
    console.error('Error warming cache:', error);
    return NextResponse.json(
      { error: 'Failed to warm cache' },
      { status: 500 }
    );
  }
}

