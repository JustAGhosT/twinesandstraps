import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isValidEmail, generatePasswordResetToken, getPasswordResetExpiry } from '@/lib/user-auth';

export async function POST(request: NextRequest) {
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
      // Invalidate any existing tokens for this user
      await prisma.passwordResetToken.updateMany({
        where: {
          user_id: user.id,
          used: false,
        },
        data: { used: true },
      });

      // Generate new token
      const token = generatePasswordResetToken();
      const expiresAt = getPasswordResetExpiry();

      await prisma.passwordResetToken.create({
        data: {
          user_id: user.id,
          token,
          expires_at: expiresAt,
        },
      });

      // Build reset URL
      const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

      // Only log reset URL in development (security: never log tokens in production)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);
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
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
