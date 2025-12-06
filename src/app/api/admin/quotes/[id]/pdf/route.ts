/**
 * API endpoint to generate and download quote PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQuote } from '@/lib/quotes/quote-management';
import { generateQuoteHTML, generateQuotePDF } from '@/lib/quotes/pdf-generation';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add admin authentication check

    const { id } = await params;
    const quoteId = parseInt(id, 10);

    if (isNaN(quoteId)) {
      return NextResponse.json(
        { error: 'Invalid quote ID' },
        { status: 400 }
      );
    }

    const quote = await getQuote(quoteId);

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Check if PDF generation is requested or HTML preview
    const format = request.nextUrl.searchParams.get('format') || 'html';

    if (format === 'pdf') {
      const pdfData = {
        quoteNumber: quote.quote_number,
        customerName: quote.customer_name,
        customerEmail: quote.customer_email,
        customerCompany: quote.customer_company || undefined,
        items: quote.items.map(item => ({
          productName: item.product_name,
          productSku: item.product_sku || undefined,
          description: item.description || undefined,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price,
        })),
        subtotal: quote.subtotal,
        vatAmount: quote.vat_amount,
        total: quote.total,
        notes: quote.notes || undefined,
        expiresAt: quote.expires_at || undefined,
        createdAt: quote.created_at,
      };

      const pdfBuffer = await generateQuotePDF(pdfData);

      if (!pdfBuffer) {
        // Fallback to HTML if PDF generation not implemented
        const html = generateQuoteHTML(pdfData);
        return new NextResponse(html, {
          headers: {
            'Content-Type': 'text/html',
          },
        });
      }

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="quote-${quote.quote_number}.pdf"`,
        },
      });
    } else {
      // Return HTML preview
      const pdfData = {
        quoteNumber: quote.quote_number,
        customerName: quote.customer_name,
        customerEmail: quote.customer_email,
        customerCompany: quote.customer_company || undefined,
        items: quote.items.map(item => ({
          productName: item.product_name,
          productSku: item.product_sku || undefined,
          description: item.description || undefined,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price,
        })),
        subtotal: quote.subtotal,
        vatAmount: quote.vat_amount,
        total: quote.total,
        notes: quote.notes || undefined,
        expiresAt: quote.expires_at || undefined,
        createdAt: quote.created_at,
      };

      const html = generateQuoteHTML(pdfData);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
  } catch (error) {
    logError('Error generating quote PDF:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

