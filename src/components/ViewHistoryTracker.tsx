'use client';

import { useEffect } from 'react';
import { useViewHistory } from '@/hooks/useViewHistory';

interface ViewHistoryTrackerProps {
  productId: number;
}

/**
 * Client component that tracks product views.
 * Must be rendered on product detail pages to record view history.
 */
export default function ViewHistoryTracker({ productId }: ViewHistoryTrackerProps) {
  const { trackView } = useViewHistory();

  useEffect(() => {
    trackView(productId);
  }, [productId, trackView]);

  return null; // This component only triggers the side effect
}
