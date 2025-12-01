import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { ProductWithCategory } from '@/types/database';
import { successResponse, errorResponse } from '@/types/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    // Validate ID
    if (isNaN(productId) || productId <= 0) {
      return NextResponse.json(
        errorResponse('Invalid product ID'),
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!product) {
      return NextResponse.json(
        errorResponse('Product not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse(product as ProductWithCategory, 'Product retrieved successfully')
    );
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      errorResponse('Failed to fetch product'),
      { status: 500 }
    );
  }
}
