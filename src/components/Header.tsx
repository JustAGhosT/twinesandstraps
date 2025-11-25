'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';

const Header: React.FC = () => {
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();

  return (
    <header className="bg-white shadow-md border-b border-accent-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-accent-900">Twines & Straps SA</span>
          </Link>
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-accent-600 hover:text-primary-600 transition-colors font-medium">
              Home
            </Link>
            <Link href="/products" className="text-accent-600 hover:text-primary-600 transition-colors font-medium">
              Products
            </Link>
            <Link href="/quote" className="text-accent-600 hover:text-primary-600 transition-colors font-medium">
              Request Quote
            </Link>
            <Link href="/contact" className="text-accent-600 hover:text-primary-600 transition-colors font-medium">
              Contact
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/cart" className="text-accent-600 hover:text-primary-600 transition-colors relative p-2 rounded-lg hover:bg-accent-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
