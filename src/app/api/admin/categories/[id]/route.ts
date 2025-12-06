import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/admin-auth';
import { updateCategorySchema, validateBody, formatZodErrors } from '@/lib/validations';
import { invalidateCategoryCache, invalidateProductCache } from '@/lib/cache';
import { requireCsrfToken } from '@/lib/security/csrf';
import { withRateLimit, getRateLimitConfig } from '@/lib/security/rate-limit-wrapper';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

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
    const categoryId = parseInt(id);

    // Validate ID
    if (isNaN(categoryId) || categoryId <= 0) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = validateBody(updateCategorySchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodErrors(validation.errors) },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // If slug is being updated, check for duplicates
    if (data.slug && data.slug !== existingCategory.slug) {
      const existingSlug = await prisma.category.findUnique({
        where: { slug: data.slug },
      });

      if (existingSlug) {
        return NextResponse.json(
          { error: 'Duplicate slug', details: { slug: 'A category with this slug already exists' } },
          { status: 409 }
        );
      }
    }

    // If parent_id is being updated, verify it exists and isn't the current category
    if (data.parent_id) {
      if (data.parent_id === categoryId) {
        return NextResponse.json(
          { error: 'Invalid parent', details: { parent_id: 'A category cannot be its own parent' } },
          { status: 400 }
        );
      }

      const parent = await prisma.category.findUnique({
        where: { id: data.parent_id },
      });

      if (!parent) {
        return NextResponse.json(
          { error: 'Parent category not found', details: { parent_id: 'Selected parent category does not exist' } },
          { status: 400 }
        );
      }
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
        ...(data.parent_id !== undefined && { parent_id: data.parent_id }),
      },
    });

    // Invalidate cache
    await invalidateCategoryCache();
    // Also invalidate products since category changes affect product listings
    await invalidateProductCache();

    return NextResponse.json(category);
  } catch (error) {
    logError('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category. Please try again.' },
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
    const categoryId = parseInt(id);

    // Validate ID
    if (isNaN(categoryId) || categoryId <= 0) {
      return NextResponse.json(
        { error: 'Invalid category ID' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { category_id: categoryId },
    });

    if (productCount > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete category with products',
          details: { products: `This category has ${productCount} product(s). Move or delete them first.` }
        },
        { status: 400 }
      );
    }

    // Check if category has child categories
    const childCount = await prisma.category.count({
      where: { parent_id: categoryId },
    });

    if (childCount > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete category with subcategories',
          details: { children: `This category has ${childCount} subcategory(ies). Delete them first.` }
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    // Invalidate cache
    await invalidateCategoryCache();
    await invalidateProductCache();

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    logError('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category. Please try again.' },
      { status: 500 }
    );
  }
}
