'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';

const Header: React.FC = () => {
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-secondary-900 text-white sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-primary-600 flex items-center justify-center bg-white">
              <span className="text-primary-600 font-bold text-xs">TS</span>
            </div>
            <span className="text-lg font-bold">TASSA</span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-sm text-white/90 hover:text-primary-600 transition-colors">
              Home
            </Link>
            <Link href="/products" className="text-sm text-white/90 hover:text-primary-600 transition-colors">
              Products
            </Link>
            <Link href="/quote" className="text-sm text-white/90 hover:text-primary-600 transition-colors">
              Request Quote
            </Link>
            <Link href="/contact" className="text-sm text-white/90 hover:text-primary-600 transition-colors">
              Contact
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link href="/cart" className="text-white/90 hover:text-primary-600 transition-colors relative p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white/90 hover:text-primary-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-secondary-700">
            <nav className="flex flex-col space-y-2">
              <Link href="/" className="px-3 py-2 text-white/90 hover:bg-secondary-800 hover:text-primary-600 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link href="/products" className="px-3 py-2 text-white/90 hover:bg-secondary-800 hover:text-primary-600 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                Products
              </Link>
              <Link href="/quote" className="px-3 py-2 text-white/90 hover:bg-secondary-800 hover:text-primary-600 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                Request Quote
              </Link>
              <Link href="/contact" className="px-3 py-2 text-white/90 hover:bg-secondary-800 hover:text-primary-600 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                Contact
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
