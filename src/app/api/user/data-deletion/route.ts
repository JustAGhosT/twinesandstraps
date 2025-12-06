/**
 * API endpoint for deleting user data (POPIA compliance)
 * Right to be forgotten / Right to deletion
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/user-auth';
import prisma from '@/lib/prisma';
import { requireCsrfToken } from '@/lib/security/csrf';
import { withRateLimit, getRateLimitConfig } from '@/lib/security/rate-limit-wrapper';
import { z } from 'zod';

const deletionSchema = z.object({
  confirm: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm deletion' }),
  }),
  reason: z.string().optional(),
});

async function handlePOST(request: NextRequest) {
  // Verify CSRF token
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  const user = getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validation = deletionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Check if user has any active orders
    const activeOrders = await prisma.order.count({
      where: {
        user_id: user.userId,
        status: {
          notIn: ['CANCELLED', 'DELIVERED'],
        },
      },
    });

    if (activeOrders > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete account with active orders',
          details: {
            active_orders: `You have ${activeOrders} active order(s). Please complete or cancel them before deleting your account.`,
          },
        },
        { status: 400 }
      );
    }

    // Anonymize user data instead of hard delete (for legal/compliance reasons)
    // This preserves order history for business records while removing PII
    await prisma.$transaction(async (tx) => {
      // Anonymize user record
      await tx.user.update({
        where: { id: user.userId },
        data: {
          name: 'Deleted User',
          email: `deleted-${user.userId}@deleted.local`,
          phone: null,
          password_hash: '', // Invalidate password
          marketing_consent: false,
        },
      });

      // Delete addresses
      await tx.address.deleteMany({
        where: { user_id: user.userId },
      });

      // Delete view history
      await tx.viewHistory.deleteMany({
        where: { user_id: user.userId },
      });

      // Delete password reset tokens
      await tx.passwordResetToken.deleteMany({
        where: { user_id: user.userId },
      });

      // Anonymize reviews (keep for business but remove personal info)
      await tx.review.updateMany({
        where: { user_id: user.userId },
        data: {
          author_name: 'Anonymous',
          author_email: null,
          user_id: null,
        },
      });

      // Delete consent record
      await tx.userConsent.deleteMany({
        where: { user_id: user.userId },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Your account and personal data have been deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting user data:', error);
    return NextResponse.json(
      { error: 'Failed to delete user data' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handlePOST, getRateLimitConfig('public'));

