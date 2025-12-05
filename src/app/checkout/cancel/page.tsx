'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';

export default function CheckoutCancelPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-card text-card-foreground rounded-lg shadow-sm p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Payment Cancelled</h1>
          <p className="text-muted-foreground">
            Your payment was cancelled. No charges have been made to your account.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-muted-foreground">
            If you experienced any issues during checkout, please contact us for assistance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => router.push('/cart')}>
              Return to Cart
            </Button>
            <Button variant="secondary" onClick={() => router.push('/products')}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

