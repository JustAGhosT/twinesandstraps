'use client';

/**
 * Admin page for viewing inventory movement history
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

// Define types locally for client component (can't import server-side enums)
const InventoryEventType = {
  STOCK_ADDED: 'STOCK_ADDED',
  STOCK_REMOVED: 'STOCK_REMOVED',
  STOCK_ADJUSTED: 'STOCK_ADJUSTED',
  SUPPLIER_DELIVERY: 'SUPPLIER_DELIVERY',
  ORDER_FULFILLMENT: 'ORDER_FULFILLMENT',
  MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT',
  STOCK_STATUS_CHANGE: 'STOCK_STATUS_CHANGE',
} as const;

const ReferenceType = {
  ORDER: 'ORDER',
  SUPPLIER_DELIVERY: 'SUPPLIER_DELIVERY',
  MANUAL: 'MANUAL',
  SYSTEM: 'SYSTEM',
} as const;

interface InventoryEvent {
  id: number;
  product_id: number;
  event_type: string;
  quantity_change: number;
  quantity_before: number | null;
  quantity_after: number | null;
  reference_type: string | null;
  reference_id: number | null;
  notes: string | null;
  created_at: string;
  product: {
    id: number;
    name: string;
    sku: string;
  };
}

interface InventoryHistoryResponse {
  success: boolean;
  events: InventoryEvent[];
  total: number;
  limit: number;
  offset: number;
}

export default function InventoryHistoryPage() {
  const [events, setEvents] = useState<InventoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    eventType: '',
    referenceType: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
  });

  useEffect(() => {
    fetchInventoryHistory();
  }, [filters, pagination.offset]);

  const fetchInventoryHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      });

      if (filters.eventType) params.append('eventType', filters.eventType);
      if (filters.referenceType) params.append('referenceType', filters.referenceType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/admin/inventory/history?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: InventoryHistoryResponse = await response.json();
      setEvents(data.events);
      setPagination(prev => ({ ...prev, total: data.total }));
    } catch (e: any) {
      setError(e.message || 'Failed to fetch inventory history');
      logError('Error fetching inventory history:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, offset: 0 })); // Reset to first page
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case InventoryEventType.STOCK_ADDED:
      case InventoryEventType.SUPPLIER_DELIVERY:
        return 'text-green-600 dark:text-green-400';
      case InventoryEventType.STOCK_REMOVED:
      case InventoryEventType.ORDER_FULFILLMENT:
        return 'text-red-600 dark:text-red-400';
      case InventoryEventType.MANUAL_ADJUSTMENT:
      case InventoryEventType.STOCK_ADJUSTED:
        return 'text-blue-600 dark:text-blue-400';
      case InventoryEventType.STOCK_STATUS_CHANGE:
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatQuantityChange = (change: number) => {
    if (change > 0) {
      return `+${change}`;
    }
    return change.toString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Inventory Movement History</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Track all stock changes and movements</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Event Type
            </label>
            <select
              id="eventType"
              value={filters.eventType}
              onChange={(e) => handleFilterChange('eventType', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Types</option>
              {Object.values(InventoryEventType).map((type) => (
                <option key={type} value={type}>
                  {formatEventType(type)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="referenceType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reference Type
            </label>
            <select
              id="referenceType"
              value={filters.referenceType}
              onChange={(e) => handleFilterChange('referenceType', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All References</option>
              {Object.values(ReferenceType).map((type) => (
                <option key={type} value={type}>
                  {formatEventType(type)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Loading inventory history...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 dark:text-red-400">
            <p>Error: {error}</p>
            <button
              onClick={fetchInventoryHistory}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Retry
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <p>No inventory events found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-secondary-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Event Type
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Quantity Change
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-secondary-800 divide-y divide-gray-200 dark:divide-secondary-700">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-secondary-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(event.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/admin/products/${event.product_id}`}
                          className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                        >
                          {event.product.name}
                        </Link>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          SKU: {event.product.sku}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getEventTypeColor(event.event_type)}`}>
                          {formatEventType(event.event_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`text-sm font-semibold ${
                            event.quantity_change > 0
                              ? 'text-green-600 dark:text-green-400'
                              : event.quantity_change < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {formatQuantityChange(event.quantity_change)}
                        </span>
                        {event.quantity_before !== null && event.quantity_after !== null && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {event.quantity_before} → {event.quantity_after}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {event.reference_type && (
                          <div>
                            <span className="font-medium">{formatEventType(event.reference_type)}</span>
                            {event.reference_id && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                ID: {event.reference_id}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {event.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-secondary-700 flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} events
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                    disabled={pagination.offset === 0}
                    className="px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-secondary-700 hover:bg-gray-50 dark:hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                    disabled={pagination.offset + pagination.limit >= pagination.total}
                    className="px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-secondary-700 hover:bg-gray-50 dark:hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

