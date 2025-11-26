'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUserAuth } from '@/contexts/UserAuthContext';

interface ViewHistoryItem {
  id: number;
  viewed_at: string;
  product: {
    id: number;
    name: string;
    price: number;
    image_url: string | null;
    category: { name: string };
  };
}

interface RecentlyViewedProps {
  excludeProductId?: number;
  limit?: number;
}

export default function RecentlyViewed({ excludeProductId, limit = 4 }: RecentlyViewedProps) {
  const { isAuthenticated } = useUserAuth();
  const [items, setItems] = useState<ViewHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchViewHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/user/view-history?limit=${limit + 1}`);
      if (res.ok) {
        const data = await res.json();
        // Filter out current product if specified
        let filtered = data.items as ViewHistoryItem[];
        if (excludeProductId) {
          filtered = filtered.filter(item => item.product.id !== excludeProductId);
        }
        setItems(filtered.slice(0, limit));
      }
    } catch (error) {
      console.error('Error fetching view history:', error);
    } finally {
      setLoading(false);
    }
  }, [limit, excludeProductId]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchViewHistory();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchViewHistory]);

  // Don't render if not authenticated or no items
  if (!isAuthenticated || loading || items.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-secondary-900 mb-6">Recently Viewed</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/products/${item.product.id}`}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="aspect-square bg-gray-100 overflow-hidden">
                {item.product.image_url ? (
                  <Image
                    src={item.product.image_url}
                    alt={item.product.name}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="text-xs text-primary-600 mb-1">{item.product.category.name}</div>
                <h3 className="font-medium text-secondary-900 truncate group-hover:text-primary-600 transition-colors">
                  {item.product.name}
                </h3>
                <div className="font-semibold text-primary-600 mt-1">
                  R {item.product.price.toFixed(2)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
