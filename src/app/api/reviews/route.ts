import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const createReviewSchema = z.object({
  productId: z.number().int().positive().optional(),
  authorName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  authorEmail: z.string().email('Invalid email').optional(),
  company: z.string().max(100).optional(),
  role: z.string().max(100).optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  content: z.string().min(10, 'Review must be at least 10 characters').max(2000),
});

/**
 * GET /api/reviews - Get approved reviews (optionally filtered by product)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    const where: Record<string, unknown> = {
      status: 'APPROVED',
    };

    if (productId) {
      where.product_id = parseInt(productId);
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews - Submit a new review (requires moderation)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = createReviewSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check if product exists if productId is provided
    if (data.productId) {
      const product = await prisma.product.findUnique({
        where: { id: data.productId },
      });
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
    }

    const review = await prisma.review.create({
      data: {
        product_id: data.productId || null,
        author_name: data.authorName,
        author_email: data.authorEmail || null,
        company: data.company || null,
        role: data.role || null,
        rating: data.rating,
        title: data.title || null,
        content: data.content,
        status: 'PENDING',
        verified_purchase: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for your review! It will be published after moderation.',
      review: { id: review.id },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review. Please try again.' },
      { status: 500 }
    );
  }
}
