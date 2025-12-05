import { requireAdminAuth } from '@/lib/admin-auth';
import { invalidateCategoryCache, invalidateProductCache } from '@/lib/cache';
import { trackStockStatusChange } from '@/lib/inventory/tracking';
import prisma from '@/lib/prisma';
import { formatZodErrors, updateProductSchema, validateBody } from '@/lib/validations';
import { errorResponse, successResponse } from '@/types/api';
import type { ProductWithCategory } from '@/types/database';
import { NextRequest, NextResponse } from 'next/server';
import { requireCsrfToken } from '@/lib/security/csrf';
import { withRateLimit, getRateLimitConfig } from '@/lib/security/rate-limit-wrapper';

async function handlePUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify CSRF token
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  // Verify admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

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

    const body = await request.json();

    // Validate input
    const validation = validateBody(updateProductSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        errorResponse('Validation failed', formatZodErrors(validation.errors)),
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json(
        errorResponse('Product not found'),
        { status: 404 }
      );
    }

    // If category_id is being updated, verify it exists
    if (data.category_id) {
      const category = await prisma.category.findUnique({
        where: { id: data.category_id },
      });

      if (!category) {
        return NextResponse.json(
          errorResponse('Category not found', { category_id: 'Selected category does not exist' }),
          { status: 400 }
        );
      }
    }

    // If SKU is being updated, check for duplicates
    if (data.sku && data.sku !== existingProduct.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: data.sku },
      });

      if (existingSku) {
        return NextResponse.json(
          errorResponse('Duplicate SKU', { sku: 'A product with this SKU already exists' }),
          { status: 409 }
        );
      }
    }

    // Track stock status change if it's being updated
    if (data.stock_status && data.stock_status !== existingProduct.stock_status) {
      await trackStockStatusChange(
        productId,
        existingProduct.stock_status,
        data.stock_status
      );
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.sku && { sku: data.sku }),
        ...(data.description && { description: data.description }),
        ...(data.material !== undefined && { material: data.material }),
        ...(data.diameter !== undefined && { diameter: data.diameter }),
        ...(data.length !== undefined && { length: data.length }),
        ...(data.strength_rating !== undefined && { strength_rating: data.strength_rating }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.vat_applicable !== undefined && { vat_applicable: data.vat_applicable }),
        ...(data.stock_status && { stock_status: data.stock_status }),
        ...(data.image_url !== undefined && { image_url: data.image_url }),
        ...(data.category_id && { category_id: data.category_id }),
      },
      include: { category: true },
    });

    // Invalidate cache
    await invalidateProductCache(productId);
    if (data.category_id) {
      await invalidateCategoryCache();
    }

    return NextResponse.json(
      successResponse(product as ProductWithCategory, 'Product updated successfully')
    );
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      errorResponse('Failed to update product. Please try again.'),
      { status: 500 }
    );
  }
}

async function handleDELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify CSRF token
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  // Verify admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

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

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json(
        errorResponse('Product not found'),
        { status: 404 }
      );
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    // Invalidate cache
    await invalidateProductCache(productId);

    return NextResponse.json(
      successResponse(null, 'Product deleted successfully')
    );
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      errorResponse('Failed to delete product. Please try again.'),
      { status: 500 }
    );
  }
}
