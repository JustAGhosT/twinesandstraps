import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/admin-auth';
import { createProductSchema, validateBody, formatZodErrors } from '@/lib/validations';
import type { ProductWithCategory } from '@/types/database';
import { successResponse, errorResponse } from '@/types/api';

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();

    // Validate input
    const validation = validateBody(createProductSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        errorResponse('Validation failed', formatZodErrors(validation.errors)),
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: data.category_id },
    });

    if (!category) {
      return NextResponse.json(
        errorResponse('Category not found', { category_id: 'Selected category does not exist' }),
        { status: 400 }
      );
    }

    // Check for duplicate SKU
    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingSku) {
      return NextResponse.json(
        errorResponse('Duplicate SKU', { sku: 'A product with this SKU already exists' }),
        { status: 409 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        description: data.description,
        material: data.material ?? null,
        diameter: data.diameter ?? null,
        length: data.length ?? null,
        strength_rating: data.strength_rating ?? null,
        price: data.price,
        vat_applicable: data.vat_applicable,
        stock_status: data.stock_status,
        image_url: data.image_url ?? null,
        category_id: data.category_id,
      },
      include: { category: true },
    });

    return NextResponse.json(
      successResponse(product as ProductWithCategory, 'Product created successfully'),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      errorResponse('Failed to create product. Please try again.'),
      { status: 500 }
    );
  }
}
