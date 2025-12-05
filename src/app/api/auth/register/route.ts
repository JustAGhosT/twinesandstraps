import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, createUserSession } from '@/lib/user-auth';
import { userRegistrationSchema, validateBody, formatZodErrors } from '@/lib/validations';
import { requireCsrfToken } from '@/lib/security/csrf';
import { withRateLimit, getRateLimitConfig } from '@/lib/security/rate-limit-wrapper';

async function handlePOST(request: NextRequest) {
  // Verify CSRF token
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();

    // Validate input
    const validation = validateBody(userRegistrationSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodErrors(validation.errors) },
        { status: 400 }
      );
    }

    const { name, email, phone, password, marketingConsent } = validation.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        password_hash: passwordHash,
        role: 'CUSTOMER',
        marketing_consent: marketingConsent,
      },
    });

    // Create session
    const session = createUserSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // Set HTTP-only cookie
    response.cookies.set('user_session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handlePOST, getRateLimitConfig('auth'));
