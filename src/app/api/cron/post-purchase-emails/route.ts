/**
 * Cron job endpoint for processing post-purchase email follow-ups
 * Should be called daily via Azure Functions or scheduled job
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendPostPurchaseEmailDay1, sendPostPurchaseEmailDay3, sendPostPurchaseEmailDay7 } from '@/lib/email/post-purchase';
import { trackEvent } from '@/lib/monitoring/app-insights';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (!CRON_SECRET || providedSecret !== CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Track email series start
    trackEvent('PostPurchaseEmailSeriesStarted', {
      timestamp: new Date().toISOString(),
    });

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Find orders that need follow-up emails
    const ordersDay1 = await prisma.order.findMany({
      where: {
        status: 'CONFIRMED',
        payment_status: 'PAID',
        created_at: {
          gte: oneDayAgo,
          lt: now,
        },
        // TODO: Add field to track if Day 1 email sent
      },
      include: {
        user: true,
        items: true,
      },
      take: 100, // Limit to prevent overload
    });

    const ordersDay3 = await prisma.order.findMany({
      where: {
        status: { in: ['SHIPPED', 'DELIVERED'] },
        created_at: {
          gte: threeDaysAgo,
          lt: new Date(threeDaysAgo.getTime() + 24 * 60 * 60 * 1000),
        },
        // TODO: Add field to track if Day 3 email sent
      },
      include: {
        user: true,
        items: true,
      },
      take: 100,
    });

    const ordersDay7 = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        created_at: {
          gte: sevenDaysAgo,
          lt: new Date(sevenDaysAgo.getTime() + 24 * 60 * 60 * 1000),
        },
        // TODO: Add field to track if Day 7 email sent
      },
      include: {
        user: true,
        items: true,
      },
      take: 100,
    });

    const results = {
      sentDay1: 0,
      sentDay3: 0,
      sentDay7: 0,
      errors: 0,
    };

    // Send Day 1 emails (order confirmation/thank you)
    for (const order of ordersDay1) {
      try {
        if (order.user?.email) {
          const success = await sendPostPurchaseEmailDay1({
            orderId: order.order_number,
            email: order.user.email,
            firstName: order.user.name.split(' ')[0],
            lastName: order.user.name.split(' ').slice(1).join(' '),
            items: order.items.map(item => ({
              name: item.product_name,
              quantity: item.quantity,
              price: item.unit_price,
            })),
            total: order.total,
            orderDate: order.created_at,
            trackingNumber: order.tracking_number || undefined,
          });
          if (success) results.sentDay1++;
        }
      } catch (error) {
        console.error('Error sending Day 1 post-purchase email:', error);
        results.errors++;
      }
    }

    // Send Day 3 emails (review request)
    for (const order of ordersDay3) {
      try {
        if (order.user?.email) {
          const success = await sendPostPurchaseEmailDay3({
            orderId: order.order_number,
            email: order.user.email,
            firstName: order.user.name.split(' ')[0],
            lastName: order.user.name.split(' ').slice(1).join(' '),
            items: order.items.map(item => ({
              name: item.product_name,
              quantity: item.quantity,
              price: item.unit_price,
            })),
            total: order.total,
            orderDate: order.created_at,
            trackingNumber: order.tracking_number || undefined,
          });
          if (success) results.sentDay3++;
        }
      } catch (error) {
        console.error('Error sending Day 3 post-purchase email:', error);
        results.errors++;
      }
    }

    // Send Day 7 emails (related products)
    for (const order of ordersDay7) {
      try {
        if (order.user?.email) {
          const success = await sendPostPurchaseEmailDay7({
            orderId: order.order_number,
            email: order.user.email,
            firstName: order.user.name.split(' ')[0],
            lastName: order.user.name.split(' ').slice(1).join(' '),
            items: order.items.map(item => ({
              name: item.product_name,
              quantity: item.quantity,
              price: item.unit_price,
            })),
            total: order.total,
            orderDate: order.created_at,
            trackingNumber: order.tracking_number || undefined,
          });
          if (success) results.sentDay7++;
        }
      } catch (error) {
        console.error('Error sending Day 7 post-purchase email:', error);
        results.errors++;
      }
    }

    // Track completion
    trackEvent('PostPurchaseEmailSeriesCompleted', {
      day1Sent: results.sentDay1,
      day3Sent: results.sentDay3,
      day7Sent: results.sentDay7,
      errors: results.errors,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error: any) {
    console.error('Error in post-purchase email cron:', error);
    
    trackEvent('PostPurchaseEmailSeriesFailed', {
      error: error.message,
    });

    return NextResponse.json(
      { error: error.message || 'Failed to process post-purchase emails' },
      { status: 500 }
    );
  }
}

