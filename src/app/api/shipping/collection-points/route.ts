/**
 * API endpoint for searching collection points
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchCollectionPoints } from '@/lib/shipping/service';
import { z } from 'zod';

const searchSchema = z.object({
  postalCode: z.string().min(1),
  city: z.string().optional(),
  province: z.string().optional(),
  radiusKm: z.number().min(1).max(50).optional().default(10),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = searchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { postalCode, city, province, radiusKm } = validation.data;

    const points = await searchCollectionPoints(postalCode, city, province, radiusKm);

    return NextResponse.json({
      success: true,
      collectionPoints: points,
      count: points.length,
    });
  } catch (error) {
    console.error('Collection points search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

