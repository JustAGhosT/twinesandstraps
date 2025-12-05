'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import RecommendedProducts from '@/components/RecommendedProducts';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useToast } from '@/components/Toast';
import { trackBeginCheckout } from '@/lib/analytics';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const { settings } = useSiteSettings();
  const showRecommendedProducts = useFeatureFlag('recommendedProducts');
  const { warning } = useToast();

  // Track begin checkout when cart has items
  useEffect(() => {
    if (items.length > 0) {
      trackBeginCheckout(
        items.map(item => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        })),
        getTotalPrice()
      );
    }
  }, [items.length]); // Only track when items change

  const handleSendToWhatsApp = () => {
    const whatsappNumber = settings.whatsappNumber;

    // Validate WhatsApp number is configured
    if (!whatsappNumber || whatsappNumber === '27XXXXXXXXX') {
      warning(`WhatsApp not configured. Please contact us at ${settings.email}`);
      return;
    }

    // Build quote message with all cart items
    let message = `Hi! I'd like to request a quote for the following items:\n\n`;
    
    items.forEach((item, index) => {
      const sanitizedName = String(item.product.name || 'Product');
      const sanitizedSku = String(item.product.sku || 'N/A');
      const itemTotal = item.product.price * item.quantity;
      
      message += `${index + 1}. ${sanitizedName}\n`;
      message += `   SKU: ${sanitizedSku}\n`;
      message += `   Quantity: ${item.quantity}\n`;
      message += `   Price per unit: ZAR ${item.product.price.toFixed(2)}\n`;
      message += `   Subtotal: ZAR ${itemTotal.toFixed(2)}\n\n`;
    });

    message += `Total: ZAR ${getTotalPrice().toFixed(2)}\n\n`;
    message += `Please send me a quote. Thank you!`;

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (items.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-secondary-900 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 text-secondary-900 dark:text-white">Your Cart</h1>
          <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm p-8 md:p-12 text-center mb-8">
            <svg className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">Your cart is empty</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Add some products to get started with your quote</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/products" className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                Browse Products
              </Link>
              <Link href="/quote" className="inline-block border-2 border-primary-600 text-primary-600 dark:text-primary-400 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors">
                Request Custom Quote
              </Link>
            </div>
          </div>

          {/* Recommended Products */}
          {showRecommendedProducts && (
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm p-6">
              <RecommendedProducts title="You might be interested in" maxProducts={4} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-secondary-900 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-secondary-900 dark:text-white">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm">
              {items.map((item) => (
                <div key={item.product.id} className="p-6 border-b dark:border-secondary-700 last:border-b-0">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-secondary-700 rounded flex-shrink-0 relative overflow-hidden">
                      {item.product.image_url ? (
                        <Image
                          src={item.product.image_url}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex-grow">
                      <Link href={`/products/${item.product.slug || item.product.id}`} className="text-lg font-semibold text-secondary-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400">
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">SKU: {item.product.sku}</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mt-2">
                        ZAR {item.product.price.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-4">
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-semibold"
                      >
                        Remove
                      </button>

                      <div className="flex items-center border dark:border-secondary-600 rounded">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-secondary-700 text-secondary-900 dark:text-white"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              updateQuantity(item.product.id, value);
                            }
                          }}
                          className="w-16 text-center border-x dark:border-secondary-600 py-1 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white"
                          min="1"
                        />
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-secondary-700 text-secondary-900 dark:text-white"
                        >
                          +
                        </button>
                      </div>

                      <p className="text-lg font-semibold text-secondary-900 dark:text-white">
                        ZAR {(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-bold mb-4 text-secondary-900 dark:text-white">Order Summary</h2>

              {(() => {
                const subtotal = getTotalPrice();
                const vatRate = 0.15; // South African VAT rate
                const vatAmount = subtotal * vatRate;
                const total = subtotal + vatAmount;
                const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

                return (
                  <>
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Items ({itemCount})</span>
                        <span>R {subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Subtotal (excl. VAT)</span>
                        <span>R {subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>VAT (15%)</span>
                        <span>R {vatAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="border-t dark:border-secondary-700 pt-4 mb-2">
                      <div className="flex justify-between text-lg font-bold text-secondary-900 dark:text-white">
                        <span>Total (incl. VAT)</span>
                        <span>R {total.toFixed(2)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">* Final quote may vary based on quantity and delivery</p>
                  </>
                );
              })()}

              <Link
                href="/checkout"
                className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 mb-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Proceed to Checkout
              </Link>

              <button
                onClick={handleSendToWhatsApp}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 mb-3"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Request Quote via WhatsApp
              </button>

              <Link
                href="/products"
                className="block w-full text-center py-3 px-6 rounded-lg font-semibold border-2 border-gray-300 dark:border-secondary-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors"
              >
                Continue Shopping
              </Link>

              <button
                onClick={clearCart}
                className="w-full mt-4 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
