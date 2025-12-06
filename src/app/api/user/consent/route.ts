/**
 * API endpoint for managing user consent preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/user-auth';
import { storeUserConsent } from '@/lib/popia/consent';
import { requireCsrfToken } from '@/lib/security/csrf';
import { withRateLimit, getRateLimitConfig } from '@/lib/security/rate-limit-wrapper';
import { z } from 'zod';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

const consentSchema = z.object({
  marketing: z.boolean(),
  analytics: z.boolean(),
  functional: z.boolean(),
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
    const validation = consentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await storeUserConsent(user.userId, validation.data);

    return NextResponse.json({
      success: true,
      message: 'Consent preferences saved successfully',
    });
  } catch (error) {
    logError('Error saving consent:', error);
    return NextResponse.json(
      { error: 'Failed to save consent preferences' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handlePOST, getRateLimitConfig('public'));

