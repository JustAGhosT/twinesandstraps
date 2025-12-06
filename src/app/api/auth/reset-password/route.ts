import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, validatePasswordStrength } from '@/lib/user-auth';
import { requireCsrfToken } from '@/lib/security/csrf';
import { withRateLimit, getRateLimitConfig } from '@/lib/security/rate-limit-wrapper';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

async function handlePOST(request: NextRequest) {
  // Verify CSRF token
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  try {
    const { token, password, confirmPassword } = await request.json();

    // Validate inputs
    if (!token) {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      );
    }

    if (!password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Password and confirmation are required' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 400 }
      );
    }

    if (resetToken.used) {
      return NextResponse.json(
        { error: 'This reset link has already been used' },
        { status: 400 }
      );
    }

    if (new Date() > resetToken.expires_at) {
      // Mark as used so it can't be tried again
      await prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      });
      return NextResponse.json(
        { error: 'This reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash new password and update user
    const passwordHash = hashPassword(password);

    await prisma.$transaction([
      // Update user password
      prisma.user.update({
        where: { id: resetToken.user_id },
        data: { password_hash: passwordHash },
      }),
      // Mark token as used
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    logError('Reset password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handlePOST, getRateLimitConfig('auth'));

// GET to validate token (check if it's valid before showing form)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json({ valid: false, error: 'Invalid reset link' });
    }

    if (resetToken.used) {
      return NextResponse.json({ valid: false, error: 'This reset link has already been used' });
    }

    if (new Date() > resetToken.expires_at) {
      return NextResponse.json({ valid: false, error: 'This reset link has expired' });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    logError('Token validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
