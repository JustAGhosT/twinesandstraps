import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Product } from '@/types/database';
import { successResponse, errorResponse } from '@/types/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        stock_status: {
          not: 'OUT_OF_STOCK'
        }
      },
      take: 8,
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json(
      successResponse(products as Product[], 'Featured products retrieved successfully')
    );
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      errorResponse('Failed to fetch featured products'),
      { status: 500 }
    );
  }
}
