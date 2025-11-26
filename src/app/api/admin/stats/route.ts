import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
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
