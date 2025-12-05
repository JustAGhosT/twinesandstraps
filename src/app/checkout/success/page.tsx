'use client';

import React, { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { trackPurchase } from '@/lib/analytics';
import { useCart } from '@/contexts/CartContext';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCart();
  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    // Track purchase in analytics
    if (paymentId && items.length > 0) {
      trackPurchase(
        paymentId,
        items.map(item => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        })),
        getTotalPrice()
      );

      // Clear cart after successful payment
      clearCart();
    }
  }, [paymentId, items, getTotalPrice, clearCart]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-card text-card-foreground rounded-lg shadow-sm p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Thank you for your order. Your payment has been processed successfully.
          </p>
        </div>

        {paymentId && (
          <div className="bg-muted p-4 rounded-lg mb-6">
            <p className="text-sm text-muted-foreground mb-1">Order Reference</p>
            <p className="font-mono font-semibold">{paymentId}</p>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-muted-foreground">
            You will receive an order confirmation email shortly with all the details.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => router.push('/products')}>
              Continue Shopping
            </Button>
            <Button variant="secondary" onClick={() => router.push('/')}>
              Go Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

