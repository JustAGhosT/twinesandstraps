'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';

export default function QuotePage() {
  const { items, getTotalItems } = useCart();
  const hasItems = getTotalItems() > 0;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Request a Quote</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <svg className="w-16 h-16 mx-auto text-primary-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">How to Request a Quote</h2>
            <p className="text-gray-600">
              To request a quote, add products to your cart and then send us your quote request via WhatsApp.
            </p>
          </div>

          {hasItems ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">
                  You have {getTotalItems()} item{getTotalItems() > 1 ? 's' : ''} in your cart!
                </p>
                <p className="text-green-700 text-sm mt-1">
                  Click below to review your cart and send your quote request.
                </p>
              </div>
              <Link
                href="/cart"
                className="block w-full text-center bg-primary-600 hover:bg-primary-500 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
              >
                View Cart & Send Quote
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-800 font-medium">
                  Your cart is empty
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  Browse our products and add items to your cart to request a quote.
                </p>
              </div>
              <Link
                href="/products"
                className="block w-full text-center bg-primary-600 hover:bg-primary-500 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
              >
                Browse Products
              </Link>
            </div>
          )}

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
            <p className="text-gray-600 mb-4">
              If you need assistance or have questions about our products, don&apos;t hesitate to contact us.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center text-primary-600 hover:text-primary-500 font-medium"
            >
              Contact Us
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
