import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Category } from '@/types/database';
import { successResponse, errorResponse } from '@/types/api';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Extended category type with product count
interface CategoryWithCount extends Category {
  _count: {
    products: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeProducts = searchParams.get('includeProducts') === 'true';
    const parentOnly = searchParams.get('parentOnly') === 'true';

    const where = parentOnly ? { parent_id: null } : {};

    const categories = await prisma.category.findMany({
      where,
      include: {
        _count: {
          select: { products: true },
        },
        ...(includeProducts && {
          products: {
            take: 10,
            orderBy: { created_at: 'desc' },
          },
        }),
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(
      successResponse(categories as CategoryWithCount[], 'Categories retrieved successfully')
    );
  } catch (error) {
    logError('Error fetching categories:', error);
    return NextResponse.json(
      errorResponse('Failed to fetch categories'),
      { status: 500 }
    );
  }
}
