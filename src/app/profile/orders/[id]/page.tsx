'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { ORDER_STATUS, PAYMENT_STATUS, ORDER_STATUS_LABELS } from '@/constants';

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
  items: OrderItem[];
  shipping_address: Address | null;
  billing_address: Address | null;
  status_history: StatusHistory[];
}

const ORDER_STATUSES = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.DELIVERED,
];

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading: authLoading } = useUserAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?from=/profile/orders');
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/user/orders/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
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
    if (isAuthenticated && params.id) {
      fetchOrder();
    }
  }, [isAuthenticated, params.id, fetchOrder]);

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
      [PAYMENT_STATUS.PENDING]: 'text-yellow-600 bg-yellow-50',
      [PAYMENT_STATUS.PAID]: 'text-green-600 bg-green-50',
      [PAYMENT_STATUS.FAILED]: 'text-red-600 bg-red-50',
      [PAYMENT_STATUS.REFUNDED]: 'text-blue-600 bg-blue-50',
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  const getCurrentStepIndex = () => {
    if (order?.status === ORDER_STATUS.CANCELLED) return -1;
    const status = (order?.status || ORDER_STATUS.PENDING) as (typeof ORDER_STATUSES)[number];
    return ORDER_STATUSES.indexOf(status);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-secondary-900 mb-4">Order Not Found</h1>
        <p className="text-gray-500 mb-6">{error || 'The order you&apos;re looking for doesn&apos;t exist.'}</p>
        <Link href="/profile" className="text-primary-600 hover:text-primary-700 font-medium">
          Back to Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/profile" className="text-primary-600 hover:text-primary-700 flex items-center gap-2 mb-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Profile
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Order #{order.order_number}</h1>
            <p className="text-gray-500">
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
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getPaymentStatusColor(order.payment_status)}`}>
              Payment: {order.payment_status}
            </span>
          </div>
        </div>
      </div>

      {/* Order Status Tracker */}
      {order.status !== ORDER_STATUS.CANCELLED && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-6">Order Status</h2>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded">
              <div
                className="h-full bg-primary-600 rounded transition-all duration-500"
                style={{ width: `${(getCurrentStepIndex() / (ORDER_STATUSES.length - 1)) * 100}%` }}
              />
            </div>

            {/* Status Steps */}
            <div className="relative flex justify-between">
              {ORDER_STATUSES.map((status, index) => {
                const isCompleted = index <= getCurrentStepIndex();
                const isCurrent = index === getCurrentStepIndex();
                return (
                  <div key={status} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-colors ${
                        isCompleted ? getStatusColor(status) + ' text-white' : 'bg-gray-200 text-gray-500'
                      } ${isCurrent ? 'ring-4 ring-primary-200' : ''}`}
                    >
                      {isCompleted ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <span className={`mt-2 text-xs font-medium ${isCompleted ? 'text-secondary-900' : 'text-gray-400'}`}>
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tracking Info */}
          {order.tracking_number && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Tracking Number:</span>
                <span className="font-mono">{order.tracking_number}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cancelled Order Notice */}
      {order.status === ORDER_STATUS.CANCELLED && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 text-red-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">This order has been cancelled</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">
              Items ({order.items.length})
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 border border-gray-100 rounded-lg">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product.image_url ? (
                      <Image
                        src={item.product.image_url}
                        alt={item.product_name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Link
                      href={`/products/${item.product.id}`}
                      className="font-medium text-secondary-900 hover:text-primary-600"
                    >
                      {item.product_name}
                    </Link>
                    <div className="text-sm text-gray-500">SKU: {item.product_sku}</div>
                    <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">R {item.total_price.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">R {item.unit_price.toFixed(2)} each</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status History */}
          {order.status_history.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Order Timeline</h2>
              <div className="space-y-4">
                {order.status_history.map((history, index) => (
                  <div key={history.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary-600' : 'bg-gray-300'}`} />
                      {index < order.status_history.length - 1 && (
                        <div className="w-px h-full bg-gray-200 my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="font-medium text-secondary-900">{history.status}</div>
                      {history.notes && <div className="text-sm text-gray-500">{history.notes}</div>}
                      <div className="text-xs text-gray-400 mt-1">
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

        {/* Order Summary & Addresses */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>R {order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">VAT (15%)</span>
                <span>R {order.vat_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span>{order.shipping_cost > 0 ? `R ${order.shipping_cost.toFixed(2)}` : 'Free'}</span>
              </div>
              <hr />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary-600">R {order.total.toFixed(2)}</span>
              </div>
            </div>
            {order.payment_method && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-gray-500">Payment Method</div>
                <div className="font-medium">{order.payment_method}</div>
              </div>
            )}
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Shipping Address</h2>
              <div className="text-sm text-gray-600">
                <div className="font-medium text-secondary-900 mb-1">{order.shipping_address.label}</div>
                {order.shipping_address.street_address}<br />
                {order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.postal_code}<br />
                {order.shipping_address.country}
              </div>
            </div>
          )}

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Order Notes</h2>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}

          {/* Need Help */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-secondary-900 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              If you have questions about your order, please contact us.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              Contact Support
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
