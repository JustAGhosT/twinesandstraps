import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json([], { status: 500 });
  }
}
