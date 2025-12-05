'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { event } from '@/lib/analytics';

export default function QuoteConfirmationPage() {
  const searchParams = useSearchParams();
  const quoteNumber = searchParams.get('quote');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Track conversion
    if (quoteNumber) {
      event('generate_lead', {
        lead_type: 'quote_request',
        quote_number: quoteNumber,
      });
    }
    setIsLoading(false);
  }, [quoteNumber]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-secondary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-600 via-green-500 to-green-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-6">
            <svg
              className="w-20 h-20 mx-auto text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Quote Request Received!</h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto">
            Thank you for your interest. We&apos;ll get back to you shortly with a personalized quote.
          </p>
        </div>
      </section>

      <div className="bg-gray-50 dark:bg-secondary-900 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6 md:p-8">
              {/* Quote Reference */}
              {quoteNumber && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-6 h-6 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Quote Reference</p>
                      <p className="text-lg font-bold text-green-700 dark:text-green-400">
                        {quoteNumber}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* What Happens Next */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
                  What Happens Next?
                </h2>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                        1
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary-900 dark:text-white mb-1">
                        We&apos;ve Received Your Request
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Your quote request has been submitted successfully. You should receive a
                        confirmation email shortly.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                        2
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary-900 dark:text-white mb-1">
                        We&apos;ll Review Your Requirements
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Our team will review your quote request and prepare a personalized quote
                        based on your specific needs.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                        3
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-secondary-900 dark:text-white mb-1">
                        You&apos;ll Receive Your Quote
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        We aim to respond within 24 hours with a detailed quote including pricing,
                        specifications, and delivery information.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estimated Response Time */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                      Estimated Response Time
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      We typically respond to quote requests within 24 hours during business days.
                      For urgent requests, please call us directly.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-secondary-700 rounded-lg">
                <h3 className="font-semibold text-secondary-900 dark:text-white mb-3">
                  Need Immediate Assistance?
                </h3>
                <div className="space-y-2 text-sm">
                  <a
                    href="tel:0741874975"
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    074 187 4975
                  </a>
                  <a
                    href="mailto:info@twinesandstraps.co.za"
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    info@twinesandstraps.co.za
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/products"
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 px-6 rounded-lg font-semibold text-center transition-colors"
                >
                  Continue Shopping
                </Link>
                <Link
                  href="/"
                  className="flex-1 bg-gray-200 dark:bg-secondary-700 hover:bg-gray-300 dark:hover:bg-secondary-600 text-secondary-900 dark:text-white py-3 px-6 rounded-lg font-semibold text-center transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

