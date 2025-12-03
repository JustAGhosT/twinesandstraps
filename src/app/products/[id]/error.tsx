'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

// TODO: This is a basic error boundary. A production-ready implementation
// would include more sophisticated logging and a more detailed error UI.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="mb-4">{error.message}</p>
      <button
        onClick={() => reset()}
        className="bg-primary-600 text-white px-4 py-2 rounded-lg mr-4"
      >
        Try again
      </button>
      <Link href="/products" className="text-primary-600">
        Back to Products
      </Link>
    </div>
  );
}
