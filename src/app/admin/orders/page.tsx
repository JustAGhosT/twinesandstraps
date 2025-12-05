'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ORDER_STATUS, PAYMENT_STATUS, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/constants';

interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  _count: {
    items: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ORDER_STATUSES = [
  { value: 'all', label: 'All Orders' },
  ...Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [processingBulk, setProcessingBulk] = useState(false);

  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      [ORDER_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
      [ORDER_STATUS.CONFIRMED]: 'bg-blue-100 text-blue-800',
      [ORDER_STATUS.PROCESSING]: 'bg-purple-100 text-purple-800',
      [ORDER_STATUS.SHIPPED]: 'bg-indigo-100 text-indigo-800',
      [ORDER_STATUS.DELIVERED]: 'bg-green-100 text-green-800',
      [ORDER_STATUS.CANCELLED]: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      [PAYMENT_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
      [PAYMENT_STATUS.PAID]: 'bg-green-100 text-green-800',
      [PAYMENT_STATUS.FAILED]: 'bg-red-100 text-red-800',
      [PAYMENT_STATUS.REFUNDED]: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Order Fulfillment</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage orders, shipping, and fulfillment</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              // Print shipping labels for selected orders
              if (selectedOrders.length === 0) return;
              setProcessingBulk(true);
              try {
                const res = await fetch('/api/admin/orders/bulk/labels', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ orderIds: selectedOrders }),
                });
                if (res.ok) {
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `shipping-labels-${Date.now()}.pdf`;
                  a.click();
                  setSelectedOrders([]);
                }
              } catch (error) {
                console.error('Error printing labels:', error);
              } finally {
                setProcessingBulk(false);
              }
            }}
            disabled={selectedOrders.length === 0 || processingBulk}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {processingBulk ? 'Processing...' : `Print Labels (${selectedOrders.length})`}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by order number, customer name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
          >
            {ORDER_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No orders found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-secondary-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === orders.length && orders.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrders(orders.map(o => o.id));
                        } else {
                          setSelectedOrders([]);
                        }
                      }}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-secondary-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrders([...selectedOrders, order.id]);
                          } else {
                            setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-primary-600 hover:text-primary-700"
                      >
                        #{order.order_number}
                      </Link>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {order._count.items} item{order._count.items !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">{order.user.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{order.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      R {order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {order.status === ORDER_STATUS.CONFIRMED && (
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/admin/orders/${order.id}/fulfill`, {
                                  method: 'POST',
                                });
                                if (res.ok) {
                                  fetchOrders();
                                }
                              } catch (error) {
                                console.error('Error fulfilling order:', error);
                              }
                            }}
                            className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Fulfill
                          </button>
                        )}
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} orders
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchOrders(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-secondary-700 text-gray-700 dark:text-gray-300"
              >
                Previous
              </button>
              <button
                onClick={() => fetchOrders(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-secondary-700 text-gray-700 dark:text-gray-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
