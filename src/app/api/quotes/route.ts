/**
 * Public API endpoint for submitting quote requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { createQuote } from '@/lib/quotes/quote-management';
import { sendQuoteRequestConfirmation } from '@/lib/quotes/quote-email';
import { requireCsrfToken } from '@/lib/security/csrf';
import { withRateLimit, getRateLimitConfig } from '@/lib/security/rate-limit-wrapper';
import { z } from 'zod';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

const quoteRequestSchema = z.object({
  customerName: z.string().min(1, 'Name is required'),
  customerEmail: z.string().email('Valid email is required'),
  customerPhone: z.string().optional(),
  customerCompany: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      productName: z.string().min(1),
      productSku: z.string().optional(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().nonnegative(),
      description: z.string().optional(),
    })
  ),
  notes: z.string().optional(),
});

async function handlePOST(request: NextRequest) {
  // Verify CSRF token
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();
    const validation = quoteRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Create quote in database
    const quote = await createQuote({
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      customerCompany: data.customerCompany,
      items: data.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        description: item.description,
      })),
      notes: data.notes,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    });

    // Send confirmation email
    try {
      await sendQuoteRequestConfirmation(
        quote.customer_email,
        quote.customer_name,
        quote.quote_number
      );
    } catch (emailError) {
      // Log but don't fail the request if email fails
      logError('Failed to send quote confirmation email:', emailError);
    }

    return NextResponse.json({
      success: true,
      quoteId: quote.id,
      quoteNumber: quote.quote_number,
    });
  } catch (error) {
    logError('Error creating quote:', error);
    return NextResponse.json(
      { error: 'Failed to submit quote request. Please try again.' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handlePOST, getRateLimitConfig('public'));

