'use client';

import NotFound from '@/components/NotFound';
import { Button } from '@/components/Button';
import { useEffect } from 'react';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service in production
    logError('Product page error:', error);
  }, [error]);

  // If it's a "not found" type error, show NotFound component
  if (error.message.includes('not found') || error.message.includes('Not Found')) {
    return (
      <NotFound
        title="Product Not Found"
        message="The product you are looking for does not exist or has been removed."
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-card text-card-foreground rounded-lg shadow-sm p-8 text-center max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Unable to Load Product</h1>
        <p className="text-muted-foreground mb-6">
          We encountered an error while loading this product. Please try again.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>Try Again</Button>
          <Button variant="secondary" onClick={() => window.location.href = '/products'}>
            Browse Products
          </Button>
        </div>
      </div>
    </div>
  );
}
