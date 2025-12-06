/**
 * API endpoint for getting shipping quotes from all providers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShippingQuotes, getBestShippingQuote } from '@/lib/shipping/service';
import { ShippingQuoteRequest } from '@/lib/shipping/types';
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
  collectionPointId: z.string().optional(),
  provider: z.enum(['auto', 'all', 'courier-guy', 'pargo']).optional(),
  preference: z.enum(['cheapest', 'fastest']).optional(),
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

    const { provider = 'auto', preference = 'cheapest', ...quoteRequest } = validation.data;

    let quotes;

    if (provider === 'all') {
      // Get quotes from all providers
      quotes = await getShippingQuotes(quoteRequest as ShippingQuoteRequest);
      
      if (quotes.length === 0) {
        return NextResponse.json(
          { error: 'No shipping quotes available' },
          { status: 503 }
        );
      }

      return NextResponse.json({
        success: true,
        quotes,
        count: quotes.length,
      });
    } else {
      // Get best quote (auto-select provider)
      const quote = await getBestShippingQuote(
        quoteRequest as ShippingQuoteRequest,
        preference
      );

      if (!quote) {
        return NextResponse.json(
          { error: 'Unable to calculate shipping quote' },
          { status: 503 }
        );
      }

      return NextResponse.json({
        success: true,
        quote,
      });
    }
  } catch (error) {
    console.error('Shipping quote error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
