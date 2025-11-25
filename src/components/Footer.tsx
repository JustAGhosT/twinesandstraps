import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-secondary-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full border-2 border-primary-600 flex items-center justify-center bg-white">
                <span className="text-primary-600 font-bold text-xs">TS</span>
              </div>
              <h3 className="text-lg font-semibold">TASSA</h3>
            </div>
            <p className="text-gray-400 text-sm mb-2">
              Twines and Straps SA (Pty) Ltd
            </p>
            <p className="text-gray-400 text-sm">
              Your trusted supplier of quality ropes, twines, and straps for both retail and business customers.
            </p>
            <p className="text-primary-600 mt-3 italic text-sm">&quot;Boundless Strength, Endless Solutions!&quot;</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-gray-400 hover:text-primary-600 transition-colors text-sm">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/quote" className="text-gray-400 hover:text-primary-600 transition-colors text-sm">
                  Request a Quote
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-primary-600 transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-primary-600 transition-colors text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>Email: info@twinesandstraps.co.za</li>
              <li>Phone: +27 (0) 11 234 5678</li>
              <li>Business Hours: Mon-Fri 8:00-17:00</li>
            </ul>
            <div className="mt-4 flex gap-2">
              <span className="inline-block px-2 py-1 bg-primary-600/20 text-primary-500 rounded text-xs">🏭 Local Manufacturing</span>
              <span className="inline-block px-2 py-1 bg-primary-600/20 text-primary-500 rounded text-xs">🇿🇦 Proudly SA</span>
            </div>
          </div>
        </div>
        <div className="border-t border-secondary-700 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Twines and Straps SA (Pty) Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
