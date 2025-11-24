import React from 'react';
import Link from 'next/link';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            Twines & Straps SA
          </Link>
          <nav className="flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-gray-900 transition-colors">
              Home
            </Link>
            <Link href="/products" className="text-gray-700 hover:text-gray-900 transition-colors">
              Products
            </Link>
            <Link href="/quote" className="text-gray-700 hover:text-gray-900 transition-colors">
              Request Quote
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-gray-900 transition-colors">
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
