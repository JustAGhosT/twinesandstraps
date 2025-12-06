import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireCsrfToken } from '@/lib/security/csrf';
import { withRateLimit, getRateLimitConfig } from '@/lib/security/rate-limit-wrapper';
import { z } from 'zod';
import { successResponse, errorResponse } from '@/types/api';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

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

    return NextResponse.json(
      successResponse(reviews, 'Reviews retrieved successfully')
    );
  } catch (error) {
    logError('Error fetching reviews:', error);
    return NextResponse.json(
      errorResponse('Failed to fetch reviews'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews - Submit a new review (requires moderation)
 */
async function handlePOST(request: NextRequest) {
  // Verify CSRF token
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    
    const result = createReviewSchema.safeParse(body);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const details: Record<string, string> = {};
      for (const [key, msgs] of Object.entries(fieldErrors)) {
        if (msgs && msgs.length > 0) {
          details[key] = msgs[0];
        }
      }
      return NextResponse.json(
        errorResponse('Validation failed', details),
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
          errorResponse('Product not found'),
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

    return NextResponse.json(
      successResponse({ id: review.id }, 'Thank you for your review! It will be published after moderation.'),
      { status: 201 }
    );
  } catch (error) {
    logError('Error creating review:', error);
    return NextResponse.json(
      errorResponse('Failed to submit review. Please try again.'),
      { status: 500 }
    );
  }
}
