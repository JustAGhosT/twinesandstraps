'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/Button';

export default function QuoteConfirmationPage() {
  const searchParams = useSearchParams();
  const quoteNumber = searchParams.get('quote');
  const [quote, setQuote] = useState<{ quoteNumber: string; status?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (quoteNumber) {
      // Fetch quote details
      fetch(`/api/quotes/${quoteNumber}`)
        .then(res => res.json())
        .then(data => {
          if (data.quote) {
            setQuote(data.quote);
          } else {
            setQuote({ quoteNumber });
          }
          setLoading(false);
        })
        .catch(() => {
          setQuote({ quoteNumber });
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [quoteNumber]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!quoteNumber) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-secondary-900 mb-4">Quote Not Found</h1>
        <p className="text-gray-600 mb-8">We couldn't find your quote request.</p>
        <Link href="/quote">
          <Button>Request a New Quote</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Quote Request Received!</h1>
          <p className="text-gray-600">Thank you for your interest. We'll get back to you soon.</p>
        </div>

        {/* Quote Details Card */}
        <div className="bg-white dark:bg-secondary-900 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-white mb-6">Quote Details</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-secondary-700">
              <span className="text-gray-600 dark:text-gray-400">Quote Number:</span>
              <span className="font-mono font-semibold text-secondary-900 dark:text-white">{quoteNumber}</span>
            </div>

            {quote?.status && (
              <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-secondary-700">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  quote.status === 'SENT' ? 'bg-green-100 text-green-800' :
                  quote.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                  quote.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {quote.status}
                </span>
              </div>
            )}

            <div className="pt-4">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We've received your quote request and our team will review it shortly. You'll receive a confirmation email with your quote details.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>What happens next?</strong>
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                <li>Our team will review your requirements</li>
                <li>We'll prepare a detailed quote for you</li>
                <li>You'll receive an email with the quote within 24-48 hours</li>
                <li>You can track your quote status using the quote number above</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/products">
            <Button variant="outline">Continue Shopping</Button>
          </Link>
          <Link href="/quote">
            <Button>Request Another Quote</Button>
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Need immediate assistance?</p>
          <p className="mt-2">
            Contact us at{' '}
            <a href="mailto:info@twinesandstraps.co.za" className="text-primary-600 hover:text-primary-700">
              info@twinesandstraps.co.za
            </a>
            {' '}or call us directly.
          </p>
        </div>
      </div>
    </div>
  );
}
