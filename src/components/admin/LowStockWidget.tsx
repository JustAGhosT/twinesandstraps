'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { STOCK_STATUS } from '@/constants';

interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  stock_status: string;
  category: {
    name: string;
  };
}

interface LowStockAlert {
  products: LowStockProduct[];
  totalCount: number;
  criticalCount: number;
  warningCount: number;
}

export default function LowStockWidget() {
  const [alert, setAlert] = useState<LowStockAlert | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/inventory/low-stock')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (data.success) {
          setAlert({
            products: data.products,
            totalCount: data.totalCount,
            criticalCount: data.criticalCount,
            warningCount: data.warningCount,
          });
        }
      })
      .catch(() => setAlert({ products: [], totalCount: 0, criticalCount: 0, warningCount: 0 }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-secondary-700 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-secondary-700 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (!alert || alert.totalCount === 0) {
    return (
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
            Low Stock Alerts
          </h3>
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">All products are well stocked!</p>
      </div>
    );
  }

  const criticalProducts = alert.products.filter(
    (p) => p.stock_status === STOCK_STATUS.OUT_OF_STOCK
  );
  const warningProducts = alert.products.filter(
    (p) => p.stock_status === STOCK_STATUS.LOW_STOCK
  );

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
          Low Stock Alerts
        </h3>
        <Link
          href="/admin/products?status=LOW_STOCK"
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="space-y-4">
        {alert.criticalCount > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-600 dark:text-red-400 font-semibold">
                🚨 Out of Stock ({alert.criticalCount})
              </span>
            </div>
            <ul className="space-y-1 max-h-32 overflow-y-auto">
              {criticalProducts.slice(0, 5).map((product) => (
                <li key={product.id} className="text-sm">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    {product.name}
                  </Link>
                  <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">
                    ({product.sku})
                  </span>
                </li>
              ))}
              {criticalProducts.length > 5 && (
                <li className="text-xs text-gray-500 dark:text-gray-400">
                  +{criticalProducts.length - 5} more...
                </li>
              )}
            </ul>
          </div>
        )}

        {alert.warningCount > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
                ⚠️ Low Stock ({alert.warningCount})
              </span>
            </div>
            <ul className="space-y-1 max-h-32 overflow-y-auto">
              {warningProducts.slice(0, 5).map((product) => (
                <li key={product.id} className="text-sm">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    {product.name}
                  </Link>
                  <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">
                    ({product.sku})
                  </span>
                </li>
              ))}
              {warningProducts.length > 5 && (
                <li className="text-xs text-gray-500 dark:text-gray-400">
                  +{warningProducts.length - 5} more...
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="pt-2 border-t border-gray-200 dark:border-secondary-700">
          <Link
            href="/admin/products?status=LOW_STOCK"
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
          >
            Manage All Low Stock Products →
          </Link>
        </div>
      </div>
    </div>
  );
}

