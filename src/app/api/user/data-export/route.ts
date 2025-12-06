/**
 * API endpoint for exporting user data (POPIA compliance)
 * Right to access personal information
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/user-auth';
import prisma from '@/lib/prisma';
import { requireCsrfToken } from '@/lib/security/csrf';
import { withRateLimit, getRateLimitConfig } from '@/lib/security/rate-limit-wrapper';

async function handleGET(request: NextRequest) {
  // Verify CSRF token (for POST requests, but GET is read-only so we'll allow it)
  const user = getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Fetch all user data
    const [userData, addresses, orders, reviews, viewHistory, consent] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          marketing_consent: true,
          created_at: true,
          last_login: true,
        },
      }),
      prisma.address.findMany({
        where: { user_id: user.userId },
      }),
      prisma.order.findMany({
        where: { user_id: user.userId },
        include: {
          items: {
            select: {
              product_name: true,
              product_sku: true,
              quantity: true,
              unit_price: true,
              total_price: true,
            },
          },
          status_history: {
            select: {
              status: true,
              notes: true,
              created_at: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.review.findMany({
        where: { user_id: user.userId },
        select: {
          id: true,
          product_id: true,
          rating: true,
          title: true,
          content: true,
          status: true,
          created_at: true,
        },
      }),
      prisma.viewHistory.findMany({
        where: { user_id: user.userId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
        },
        orderBy: { viewed_at: 'desc' },
      }),
      prisma.userConsent.findUnique({
        where: { user_id: user.userId },
      }),
    ]);

    const exportData = {
      user: userData,
      addresses,
      orders: orders.map(order => ({
        ...order,
        items: order.items,
        status_history: order.status_history,
      })),
      reviews,
      view_history: viewHistory.map(vh => ({
        viewed_at: vh.viewed_at,
        product: vh.product,
      })),
      consent: consent ? {
        marketing_consent: consent.marketing_consent,
        analytics_consent: consent.analytics_consent,
        functional_consent: consent.functional_consent,
        consent_date: consent.consent_date,
        updated_at: consent.updated_at,
      } : null,
      export_date: new Date().toISOString(),
      export_version: '1.0',
    };

    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-export-${user.userId}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(handleGET, getRateLimitConfig('public'));

