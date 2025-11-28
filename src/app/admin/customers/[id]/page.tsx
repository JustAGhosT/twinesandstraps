'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Address {
  id: number;
  label: string;
  street_address: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  _count: { items: number };
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  marketing_consent: boolean;
  created_at: string;
  last_login: string | null;
  total_spent: number;
  completed_orders: number;
  addresses: Address[];
  orders: Order[];
  _count: {
    orders: number;
    addresses: number;
    view_history: number;
  };
}

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCustomer = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/customers/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setCustomer(data.customer);
      } else {
        setError('Customer not found');
      }
    } catch {
      setError('Failed to load customer');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      PROCESSING: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      SHIPPED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      REFUNDED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && !customer) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">Customer Not Found</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
        <Link href="/admin/customers" className="text-primary-600 hover:text-primary-700 font-medium">
          Back to Customers
        </Link>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/customers" className="text-primary-600 hover:text-primary-700 flex items-center gap-2 mb-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Customers
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-2xl font-bold text-primary-600 dark:text-primary-400">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">{customer.name}</h1>
              {customer.role === 'ADMIN' && (
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded-full text-sm font-medium">
                  Admin
                </span>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400">{customer.email}</p>
            {customer.phone && <p className="text-gray-500 dark:text-gray-400">{customer.phone}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Orders */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
              Recent Orders ({customer._count.orders})
            </h2>
            {customer.orders.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {customer.orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="block p-4 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-primary-600">#{order.order_number}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(order.created_at).toLocaleDateString('en-ZA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })} - {order._count.items} item{order._count.items !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-secondary-900 dark:text-white">R {order.total.toFixed(2)}</div>
                        <div className="flex gap-2 mt-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${getPaymentStatusColor(order.payment_status)}`}>
                            {order.payment_status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {customer._count.orders > 10 && (
              <div className="mt-4 text-center">
                <Link href={`/admin/orders?customer=${customer.id}`} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View All Orders
                </Link>
              </div>
            )}
          </div>

          {/* Addresses */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
              Saved Addresses ({customer._count.addresses})
            </h2>
            {customer.addresses.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No addresses saved</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customer.addresses.map((address) => (
                  <div key={address.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg relative">
                    {address.is_default && (
                      <span className="absolute top-2 right-2 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs rounded-full">
                        Default
                      </span>
                    )}
                    <div className="font-medium text-secondary-900 dark:text-white mb-1">{address.label}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {address.street_address}<br />
                      {address.city}, {address.province} {address.postal_code}<br />
                      {address.country}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Stats */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Customer Stats</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Spent</div>
                <div className="text-2xl font-bold text-primary-600">
                  R {customer.total_spent.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Orders</div>
                <div className="text-2xl font-bold text-secondary-900 dark:text-white">{customer._count.orders}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Completed Orders</div>
                <div className="text-2xl font-bold text-secondary-900 dark:text-white">{customer.completed_orders}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Products Viewed</div>
                <div className="text-2xl font-bold text-secondary-900 dark:text-white">{customer._count.view_history}</div>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Account Info</h2>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Member Since</div>
                <div className="font-medium text-secondary-900 dark:text-white">
                  {new Date(customer.created_at).toLocaleDateString('en-ZA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Last Login</div>
                <div className="font-medium text-secondary-900 dark:text-white">
                  {customer.last_login
                    ? new Date(customer.last_login).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Never'}
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Marketing Emails</div>
                <div className={`font-medium ${customer.marketing_consent ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {customer.marketing_consent ? 'Subscribed' : 'Not subscribed'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
