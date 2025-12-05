import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/admin-auth';
import { invalidateCategoryCache } from '@/lib/cache';
import { createCategorySchema, validateBody, formatZodErrors } from '@/lib/validations';

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();

    // Validate input
    const validation = validateBody(createCategorySchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodErrors(validation.errors) },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check for duplicate slug
    const existingSlug = await prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: 'Duplicate slug', details: { slug: 'A category with this slug already exists' } },
        { status: 409 }
      );
    }

    // If parent_id is provided, verify it exists
    if (data.parent_id) {
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

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        parent_id: data.parent_id ?? null,
      },
    });

    // Invalidate cache
    await invalidateCategoryCache();

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category. Please try again.' },
      { status: 500 }
    );
  }
}
