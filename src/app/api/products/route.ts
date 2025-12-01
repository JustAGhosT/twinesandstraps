import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { paginationSchema, validateBody, formatZodErrors } from '@/lib/validations';
import type { PaginatedData } from '@/types/api';
import type { ProductWithCategory } from '@/types/database';
import { successResponse, errorResponse } from '@/types/api';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      sort: searchParams.get('sort') || 'created_at',
      order: searchParams.get('order') || 'desc',
    };

    const validation = validateBody(paginationSchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        errorResponse('Invalid query parameters', formatZodErrors(validation.errors)),
        { status: 400 }
      );
    }

    const { page, limit, search, category, status, sort, order } = validation.data;

    // Build where clause for Prisma query
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      // Use 'is' for required relation filter per Prisma docs
      where.category = { is: { slug: category } };
    }

    if (status) {
      where.stock_status = status;
    }

    // Get total count
    const total = await prisma.product.count({ where });

    // Get products with pagination
    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    const paginatedData: PaginatedData<ProductWithCategory> = {
      items: products as ProductWithCategory[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };

    return NextResponse.json(
      successResponse(paginatedData, 'Products retrieved successfully')
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      errorResponse('Failed to fetch products'),
      { status: 500 }
    );
  }
}
