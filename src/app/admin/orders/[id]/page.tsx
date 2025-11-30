'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ORDER_STATUS, PAYMENT_STATUS, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/constants';

interface OrderItem {
  id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: {
    id: number;
    name: string;
    image_url: string | null;
  };
}

interface Address {
  label: string;
  street_address: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
}

interface StatusHistory {
  id: number;
  status: string;
  notes: string | null;
  created_at: string;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  subtotal: number;
  vat_amount: number;
  shipping_cost: number;
  total: number;
  notes: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  };
  items: OrderItem[];
  shipping_address: Address | null;
  billing_address: Address | null;
  status_history: StatusHistory[];
}

const ORDER_STATUSES = Object.values(ORDER_STATUS);
const PAYMENT_STATUSES = Object.values(PAYMENT_STATUS);

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        setNewStatus(data.order.status);
        setNewPaymentStatus(data.order.payment_status);
        setTrackingNumber(data.order.tracking_number || '');
      } else {
        setError('Order not found');
      }
    } catch {
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleUpdate = async () => {
    if (!order) return;

    setUpdating(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus !== order.status ? newStatus : undefined,
          payment_status: newPaymentStatus !== order.payment_status ? newPaymentStatus : undefined,
          tracking_number: trackingNumber !== order.tracking_number ? trackingNumber : undefined,
          notes: updateNotes || undefined,
        }),
      });

      if (res.ok) {
        setUpdateNotes('');
        fetchOrder(); // Refresh order data
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update order');
      }
    } catch {
      setError('Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      [ORDER_STATUS.PENDING]: 'bg-yellow-500',
      [ORDER_STATUS.CONFIRMED]: 'bg-blue-500',
      [ORDER_STATUS.PROCESSING]: 'bg-purple-500',
      [ORDER_STATUS.SHIPPED]: 'bg-indigo-500',
      [ORDER_STATUS.DELIVERED]: 'bg-green-500',
      [ORDER_STATUS.CANCELLED]: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      [PAYMENT_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      [PAYMENT_STATUS.PAID]: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      [PAYMENT_STATUS.FAILED]: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      [PAYMENT_STATUS.REFUNDED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
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

  if (error && !order) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">Order Not Found</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
        <Link href="/admin/orders" className="text-primary-600 hover:text-primary-700 font-medium">
          Back to Orders
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const hasChanges =
    newStatus !== order.status ||
    newPaymentStatus !== order.payment_status ||
    trackingNumber !== (order.tracking_number || '');

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/orders" className="text-primary-600 hover:text-primary-700 flex items-center gap-2 mb-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Orders
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Order #{order.order_number}</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Placed on {new Date(order.created_at).toLocaleDateString('en-ZA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-white text-sm font-medium ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getPaymentStatusColor(order.payment_status)}`}>
              Payment: {order.payment_status}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
              Order Items ({order.items.length})
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 border border-gray-100 dark:border-gray-700 rounded-lg">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-secondary-700 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product.image_url ? (
                      <Image
                        src={item.product.image_url}
                        alt={item.product_name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Link
                      href={`/admin/products/${item.product.id}`}
                      className="font-medium text-secondary-900 dark:text-white hover:text-primary-600"
                    >
                      {item.product_name}
                    </Link>
                    <div className="text-sm text-gray-500 dark:text-gray-400">SKU: {item.product_sku}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-secondary-900 dark:text-white">R {item.total_price.toFixed(2)}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">R {item.unit_price.toFixed(2)} each</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Contact</h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium text-secondary-900 dark:text-white">{order.user.name}</p>
                  <p className="text-gray-600 dark:text-gray-400">{order.user.email}</p>
                  {order.user.phone && <p className="text-gray-600 dark:text-gray-400">{order.user.phone}</p>}
                </div>
              </div>
              {order.shipping_address && (
                <div>
                  <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Shipping Address</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-medium text-secondary-900 dark:text-white">{order.shipping_address.label}</p>
                    <p>{order.shipping_address.street_address}</p>
                    <p>{order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.postal_code}</p>
                    <p>{order.shipping_address.country}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status History */}
          {order.status_history.length > 0 && (
            <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Order Timeline</h2>
              <div className="space-y-4">
                {order.status_history.map((history, index) => (
                  <div key={history.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`} />
                      {index < order.status_history.length - 1 && (
                        <div className="w-px h-full bg-gray-200 dark:bg-gray-700 my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="font-medium text-secondary-900 dark:text-white">{history.status}</div>
                      {history.notes && <div className="text-sm text-gray-500 dark:text-gray-400">{history.notes}</div>}
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(history.created_at).toLocaleDateString('en-ZA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                <span className="text-secondary-900 dark:text-white">R {order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">VAT (15%)</span>
                <span className="text-secondary-900 dark:text-white">R {order.vat_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Shipping</span>
                <span className="text-secondary-900 dark:text-white">{order.shipping_cost > 0 ? `R ${order.shipping_cost.toFixed(2)}` : 'Free'}</span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between font-semibold text-lg">
                <span className="text-secondary-900 dark:text-white">Total</span>
                <span className="text-primary-600">R {order.total.toFixed(2)}</span>
              </div>
            </div>
            {order.payment_method && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">Payment Method</div>
                <div className="font-medium text-secondary-900 dark:text-white">{order.payment_method}</div>
              </div>
            )}
          </div>

          {/* Update Order */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Update Order</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Order Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Status
                </label>
                <select
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
                >
                  {PAYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Add notes about this update..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 text-gray-900 dark:text-white"
                />
              </div>

              <button
                onClick={handleUpdate}
                disabled={!hasChanges || updating}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Update Order'}
              </button>
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">Order Notes</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
