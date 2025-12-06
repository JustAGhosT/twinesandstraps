import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getCurrentUser } from '@/lib/user-auth';
import { requireCsrfToken } from '@/lib/security/csrf';
import { withRateLimit, getRateLimitConfig } from '@/lib/security/rate-limit-wrapper';
import { z } from 'zod';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

const updateAddressSchema = z.object({
  label: z.string().max(50).optional(),
  street_address: z.string().min(1).max(255).optional(),
  city: z.string().min(1).max(100).optional(),
  province: z.string().min(1).max(100).optional(),
  postal_code: z.string().min(1).max(20).optional(),
  country: z.string().max(100).optional(),
  is_default: z.boolean().optional(),
});

// Update address
async function handlePUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify CSRF token
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  const user = getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const addressId = parseInt(id);

  if (isNaN(addressId)) {
    return NextResponse.json({ error: 'Invalid address ID' }, { status: 400 });
  }

  try {
    // Verify ownership
    const existing = await prisma.address.findFirst({
      where: { id: addressId, user_id: user.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = updateAddressSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Use transaction to prevent race conditions when updating default address
    const address = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // If setting as default, unset others
      if (data.is_default) {
        await tx.address.updateMany({
          where: { user_id: user.userId, is_default: true, NOT: { id: addressId } },
          data: { is_default: false },
        });
      }

      return tx.address.update({
        where: { id: addressId },
        data,
      });
    });

    return NextResponse.json({ success: true, address });
  } catch (error) {
    logError('Error updating address:', error);
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

// Delete address
async function handleDELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify CSRF token
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  const user = getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const addressId = parseInt(id);

  if (isNaN(addressId)) {
    return NextResponse.json({ error: 'Invalid address ID' }, { status: 400 });
  }

  try {
    // Verify ownership
    const existing = await prisma.address.findFirst({
      where: { id: addressId, user_id: user.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    // Use transaction to prevent race conditions when deleting and reassigning default
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.address.delete({ where: { id: addressId } });

      // If deleted address was default, set another as default
      if (existing.is_default) {
        const firstAddress = await tx.address.findFirst({
          where: { user_id: user.userId },
          orderBy: { created_at: 'asc' },
        });

        if (firstAddress) {
          await tx.address.update({
            where: { id: firstAddress.id },
            data: { is_default: true },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError('Error deleting address:', error);
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}

export const PUT = withRateLimit(handlePUT, getRateLimitConfig('public'));
export const DELETE = withRateLimit(handleDELETE, getRateLimitConfig('public'));
