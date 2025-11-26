import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for could not be found.',
};

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* Rope knot illustration using CSS */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-primary-100">
            <div className="text-6xl font-bold text-primary-600">404</div>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
          Page Not Found
        </h1>

        <p className="text-lg text-accent-500 mb-8">
          Looks like this rope has come untied! The page you&apos;re looking for
          doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold border-2 border-primary-600 hover:bg-primary-50 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Browse Products
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-accent-400 mb-4">Looking for something specific?</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/products?category=twines" className="text-sm text-primary-600 hover:text-primary-700 hover:underline">
              Twines
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/products?category=ropes" className="text-sm text-primary-600 hover:text-primary-700 hover:underline">
              Ropes
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/quote" className="text-sm text-primary-600 hover:text-primary-700 hover:underline">
              Request Quote
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/contact" className="text-sm text-primary-600 hover:text-primary-700 hover:underline">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
