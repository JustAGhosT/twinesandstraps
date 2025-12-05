/**
 * B2B Quote Management System
 * Handles quote creation, editing, status workflow, and conversion to orders
 */

import prisma from '../prisma';

export type QuoteStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface QuoteItemInput {
  productId?: number;
  productName: string;
  productSku?: string;
  description?: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateQuoteInput {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCompany?: string;
  items: QuoteItemInput[];
  notes?: string;
  expiresAt?: Date;
  createdByUserId?: number;
}

export interface UpdateQuoteInput {
  items?: QuoteItemInput[];
  notes?: string;
  expiresAt?: Date;
  status?: QuoteStatus;
}

/**
 * Generate unique quote number
 */
function generateQuoteNumber(): string {
  const prefix = 'QT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Calculate quote totals
 */
function calculateTotals(items: QuoteItemInput[]): {
  subtotal: number;
  vatAmount: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.unitPrice * item.quantity);
  }, 0);
  
  const vatAmount = subtotal * 0.15; // 15% VAT
  const total = subtotal + vatAmount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Create a new quote
 */
export async function createQuote(input: CreateQuoteInput) {
  const quoteNumber = generateQuoteNumber();
  const totals = calculateTotals(input.items);

  const quote = await prisma.quote.create({
    data: {
      quote_number: quoteNumber,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      customer_company: input.customerCompany,
      status: 'DRAFT',
      subtotal: totals.subtotal,
      vat_amount: totals.vatAmount,
      total: totals.total,
      notes: input.notes,
      expires_at: input.expiresAt,
      created_by_user_id: input.createdByUserId,
      items: {
        create: input.items.map(item => ({
          product_id: item.productId,
          product_name: item.productName,
          product_sku: item.productSku,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.unitPrice * item.quantity,
        })),
      },
      status_history: {
        create: {
          status: 'DRAFT',
          notes: 'Quote created',
        },
      },
    },
    include: {
      items: true,
      status_history: {
        orderBy: {
          created_at: 'desc',
        },
      },
    },
  });

  return quote;
}

/**
 * Update a quote
 */
export async function updateQuote(quoteId: number, input: UpdateQuoteInput) {
  const updateData: any = {
    updated_at: new Date(),
  };

  // If items are being updated, recalculate totals
  if (input.items) {
    const totals = calculateTotals(input.items);
    updateData.subtotal = totals.subtotal;
    updateData.vat_amount = totals.vatAmount;
    updateData.total = totals.total;

    // Delete existing items and create new ones
    await prisma.quoteItem.deleteMany({
      where: { quote_id: quoteId },
    });

    updateData.items = {
      create: input.items.map(item => ({
        product_id: item.productId,
        product_name: item.productName,
        product_sku: item.productSku,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.unitPrice * item.quantity,
      })),
    };
  }

  if (input.notes !== undefined) {
    updateData.notes = input.notes;
  }

  if (input.expiresAt !== undefined) {
    updateData.expires_at = input.expiresAt;
  }

  if (input.status) {
    updateData.status = input.status;
    updateData.status_history = {
      create: {
        status: input.status,
        notes: `Status changed to ${input.status}`,
      },
    };
  }

  const quote = await prisma.quote.update({
    where: { id: quoteId },
    data: updateData,
    include: {
      items: true,
      status_history: {
        orderBy: {
          created_at: 'desc',
        },
      },
    },
  });

  return quote;
}

/**
 * Get quote by ID
 */
export async function getQuote(quoteId: number) {
  return await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      status_history: {
        orderBy: {
          created_at: 'desc',
        },
      },
      attachments: true,
    },
  });
}

/**
 * Get quote by quote number
 */
export async function getQuoteByNumber(quoteNumber: string) {
  return await prisma.quote.findUnique({
    where: { quote_number: quoteNumber },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      status_history: {
        orderBy: {
          created_at: 'desc',
        },
      },
      attachments: true,
    },
  });
}

/**
 * List quotes with filters
 */
export async function listQuotes(filters?: {
  status?: QuoteStatus;
  customerEmail?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.customerEmail) {
    where.customer_email = filters.customerEmail;
  }

  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      include: {
        items: true,
        status_history: {
          take: 1,
          orderBy: {
            created_at: 'desc',
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    }),
    prisma.quote.count({ where }),
  ]);

  return {
    quotes,
    total,
    hasMore: (filters?.offset || 0) + (filters?.limit || 50) < total,
  };
}

/**
 * Mark quote as sent
 */
export async function markQuoteAsSent(quoteId: number) {
  return await updateQuote(quoteId, {
    status: 'SENT',
  });
}

/**
 * Accept a quote
 */
export async function acceptQuote(quoteId: number) {
  return await updateQuote(quoteId, {
    status: 'ACCEPTED',
  });
}

/**
 * Reject a quote
 */
export async function rejectQuote(quoteId: number, reason?: string) {
  return await updateQuote(quoteId, {
    status: 'REJECTED',
  });
}

/**
 * Check and mark expired quotes
 */
export async function markExpiredQuotes() {
  const now = new Date();
  
  const expiredQuotes = await prisma.quote.updateMany({
    where: {
      status: {
        in: ['DRAFT', 'SENT', 'VIEWED'],
      },
      expires_at: {
        lt: now,
      },
    },
    data: {
      status: 'EXPIRED',
    },
  });

  // Add status history entries for expired quotes
  const quotes = await prisma.quote.findMany({
    where: {
      status: 'EXPIRED',
      expires_at: {
        lt: now,
      },
    },
  });

  for (const quote of quotes) {
    await prisma.quoteStatusHistory.create({
      data: {
        quote_id: quote.id,
        status: 'EXPIRED',
        notes: 'Quote expired automatically',
      },
    });
  }

  return expiredQuotes.count;
}

