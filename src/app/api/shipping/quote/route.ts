/**
 * API endpoint for getting shipping quotes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShippingQuote, type ShippingQuoteRequest } from '@/lib/shipping/courier-guy';
import { z } from 'zod';

const quoteRequestSchema = z.object({
  origin: z.object({
    city: z.string().min(1),
    province: z.string().min(1),
    postalCode: z.string().min(1),
  }),
  destination: z.object({
    city: z.string().min(1),
    province: z.string().min(1),
    postalCode: z.string().min(1),
  }),
  weight: z.number().positive(),
  dimensions: z.object({
    length: z.number().positive().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
  }).optional(),
  serviceType: z.enum(['standard', 'express', 'overnight']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = quoteRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const quote = await getShippingQuote(validation.data as ShippingQuoteRequest);

    if (!quote) {
      return NextResponse.json(
        { error: 'Unable to calculate shipping quote' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      quote,
    });
  } catch (error) {
    console.error('Shipping quote error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

