import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/user-auth';
import { z } from 'zod';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  marketing_consent: z.boolean().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number'),
});

// Get user profile
export async function GET(request: NextRequest) {
  const currentUser = getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        marketing_consent: true,
        created_at: true,
        last_login: true,
        _count: {
          select: {
            orders: true,
            addresses: true,
            view_history: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    logError('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PUT(request: NextRequest) {
  const currentUser = getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, phone, marketing_consent } = validation.data;

    const user = await prisma.user.update({
      where: { id: currentUser.userId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(marketing_consent !== undefined && { marketing_consent }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        marketing_consent: true,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    logError('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

// Change password
export async function PATCH(request: NextRequest) {
  const currentUser = getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { password_hash: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    if (!verifyPassword(currentPassword, user.password_hash)) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Update password
    const newHash = hashPassword(newPassword);
    await prisma.user.update({
      where: { id: currentUser.userId },
      data: { password_hash: newHash },
    });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    logError('Error changing password:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
