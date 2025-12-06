import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/user-auth';
import { requireCsrfToken } from '@/lib/security/csrf';
import { withRateLimit, getRateLimitConfig } from '@/lib/security/rate-limit-wrapper';
import { z } from 'zod';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

const addressSchema = z.object({
  label: z.string().max(50).default('Home'),
  street_address: z.string().min(1, 'Street address is required').max(255),
  city: z.string().min(1, 'City is required').max(100),
  province: z.string().min(1, 'Province is required').max(100),
  postal_code: z.string().min(1, 'Postal code is required').max(20),
  country: z.string().max(100).default('South Africa'),
  is_default: z.boolean().default(false),
});

// Get all addresses
export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const addresses = await prisma.address.findMany({
      where: { user_id: user.userId },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    logError('Error fetching addresses:', error);
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

// Create new address
async function handlePOST(request: NextRequest) {
  // Verify CSRF token
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  const user = getCurrentUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = addressSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // If setting as default, unset other defaults
    if (data.is_default) {
      await prisma.address.updateMany({
        where: { user_id: user.userId, is_default: true },
        data: { is_default: false },
      });
    }

    // If this is the first address, make it default
    const existingCount = await prisma.address.count({
      where: { user_id: user.userId },
    });

    const address = await prisma.address.create({
      data: {
        ...data,
        user_id: user.userId,
        is_default: existingCount === 0 ? true : data.is_default,
      },
    });

    return NextResponse.json({ success: true, address }, { status: 201 });
  } catch (error) {
    logError('Error creating address:', error);
    return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
  }
}

export const POST = withRateLimit(handlePOST, getRateLimitConfig('public'));
