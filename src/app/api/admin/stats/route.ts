import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const [totalProducts, totalCategories, lowStockProducts, outOfStockProducts] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.product.count({ where: { stock_status: 'LOW_STOCK' } }),
      prisma.product.count({ where: { stock_status: 'OUT_OF_STOCK' } }),
    ]);

    return NextResponse.json({
      totalProducts,
      totalCategories,
      lowStockProducts,
      outOfStockProducts,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
