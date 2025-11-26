'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';

const Header: React.FC = () => {
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-secondary-900/95 backdrop-blur-md shadow-lg shadow-black/20' 
          : 'bg-secondary-900/90 backdrop-blur-sm'
      }`}
    >
      {/* Top accent line - industrial red stripe */}
      <div className="h-1 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600" />
      
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full border-2 border-primary-600 flex items-center justify-center bg-white shadow-md group-hover:shadow-primary-600/30 group-hover:border-primary-500 transition-all duration-300">
              <span className="text-primary-600 font-bold text-sm">TS</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-wide text-white group-hover:text-primary-500 transition-colors">TASSA</span>
              <span className="text-[10px] text-white/60 -mt-1 hidden sm:block">Boundless Strength</span>
            </div>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            {[
              { href: '/', label: 'Home' },
              { href: '/products', label: 'Products' },
              { href: '/quote', label: 'Request Quote' },
              { href: '/contact', label: 'Contact' },
            ].map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className="relative px-4 py-2 text-sm text-white/90 hover:text-white transition-colors group"
              >
                {link.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary-600 group-hover:w-3/4 transition-all duration-300" />
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {/* CTA Button - Desktop only */}
            <Link 
              href="/quote" 
              className="hidden lg:flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-primary-600/40"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Get Quote
            </Link>

            {/* Cart */}
            <Link href="/cart" className="relative p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
              aria-label="Toggle menu"
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
          <div className="md:hidden py-4 border-t border-white/10 bg-secondary-900/95 backdrop-blur-md">
            <nav className="flex flex-col space-y-1">
              {[
                { href: '/', label: 'Home' },
                { href: '/products', label: 'Products' },
                { href: '/contact', label: 'Contact' },
              ].map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="px-4 py-3 text-white/90 hover:bg-white/10 hover:text-white rounded-lg transition-all duration-300 flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                  {link.label}
                </Link>
              ))}
              <Link 
                href="/quote" 
                className="mx-4 mt-2 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Quote
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
