'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/Button';
import Image from 'next/image';

interface OrderItem {
  id: number;
  product: {
    id: number;
    name: string;
    image_url: string | null;
    price: number;
  };
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  total: number;
  items: OrderItem[];
  shipping_address: string;
  created_at: string;
  updated_at: string;
  tracking_number?: string;
}

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real implementation, fetch order from API
    // For now, this is a placeholder
    const fetchOrder = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/orders/${orderId}`);
        // const data = await response.json();
        // setOrder(data);
        
        // Placeholder data
        setOrder({
          id: orderId,
          status: 'PROCESSING',
          payment_status: 'PAID',
          total: 0,
          items: [],
          shipping_address: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setLoading(false);
      } catch (err) {
        setError('Failed to load order details');
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getStatusSteps = () => {
    const steps = [
      { key: 'PENDING', label: 'Order Placed' },
      { key: 'PROCESSING', label: 'Processing' },
      { key: 'SHIPPED', label: 'Shipped' },
      { key: 'DELIVERED', label: 'Delivered' },
    ];

    const currentIndex = steps.findIndex(s => s.key === order?.status) || 0;

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-secondary-700 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 dark:bg-secondary-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-card text-card-foreground rounded-lg shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || 'We couldn\'t find an order with that ID.'}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push('/profile/orders')}>
              View All Orders
            </Button>
            <Button variant="secondary" onClick={() => router.push('/products')}>
              Browse Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/profile/orders"
            className="text-primary hover:text-primary/90 font-semibold inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">Order #{order.id}</h1>

        {/* Order Status */}
        <div className="bg-card text-card-foreground rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold mb-2">Order Status</h2>
              <span className={`inline-block px-4 py-2 rounded-lg font-semibold ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Payment Status</p>
              <span className={`inline-block px-4 py-2 rounded-lg font-semibold ${
                order.payment_status === 'PAID' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
              }`}>
                {order.payment_status}
              </span>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="relative">
            <div className="flex items-center justify-between">
              {statusSteps.map((step, index) => (
                <div key={step.key} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        step.completed
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 dark:bg-secondary-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {step.completed ? '✓' : index + 1}
                    </div>
                    <p className={`mt-2 text-xs text-center ${step.current ? 'font-semibold' : ''}`}>
                      {step.label}
                    </p>
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 ${
                        step.completed ? 'bg-primary-600' : 'bg-gray-200 dark:bg-secondary-700'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {order.tracking_number && (
            <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <p className="text-sm font-semibold mb-1">Tracking Number</p>
              <p className="font-mono text-lg">{order.tracking_number}</p>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-card text-card-foreground rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Order Items</h2>
          {order.items.length > 0 ? (
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 pb-4 border-b last:border-0">
                  {item.product.image_url && (
                    <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-gray-100 dark:bg-secondary-700">
                      <Image
                        src={item.product.image_url}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">R{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No items found for this order.</p>
          )}

          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-2xl font-bold">R{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {order.shipping_address && (
          <div className="bg-card text-card-foreground rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
            <p className="text-muted-foreground whitespace-pre-line">{order.shipping_address}</p>
          </div>
        )}
      </div>
    </div>
  );
}

