import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { isValidEmail, generatePasswordResetToken, getPasswordResetExpiry } from '@/lib/user-auth';
import { requireCsrfToken } from '@/lib/security/csrf';
import { withRateLimit, getRateLimitConfig } from '@/lib/security/rate-limit-wrapper';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

async function handlePOST(request: NextRequest) {
  // Verify CSRF token
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  try {
    const { email } = await request.json();

    // Validate email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    // But only create token if user exists
    if (user) {
      // Generate new token
      const token = generatePasswordResetToken();
      const expiresAt = getPasswordResetExpiry();

      // Use transaction to ensure token invalidation and creation are atomic
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Invalidate any existing tokens for this user
        await tx.passwordResetToken.updateMany({
          where: {
            user_id: user.id,
            used: false,
          },
          data: { used: true },
        });

        // Create new token
        await tx.passwordResetToken.create({
          data: {
            user_id: user.id,
            token,
            expires_at: expiresAt,
          },
        });
      });

      // Build reset URL
      const { getSiteUrl } = await import('@/lib/env');
      const resetUrl = `${getSiteUrl()}/reset-password?token=${token}`;

      // Only log reset URL in development (security: never log tokens in production)
      if (process.env.NODE_ENV === 'development') {
        logInfo(`[DEV] Password reset link for ${email}: ${resetUrl}`);
      }

      // TODO: Send email with reset link in production
      // await sendPasswordResetEmail(user.email, user.name, resetUrl);
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    logError('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handlePOST, getRateLimitConfig('auth'));
