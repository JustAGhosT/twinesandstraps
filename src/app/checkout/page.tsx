'use client';

import React, { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { generateCheckoutUrl } from '@/lib/payfast/checkout';
import { isPayFastConfigured } from '@/lib/payfast/config';
import { useToast } from '@/components/Toast';
import { addressSchema, SA_PROVINCES, validateAddress, formatPhoneNumber, type AddressFormData } from '@/lib/validations/address';

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCart();
  const router = useRouter();
  const { error: showError } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    province: '' as typeof SA_PROVINCES[number] | '',
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof AddressFormData, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user starts typing
    if (errors[name as keyof AddressFormData]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only digits, spaces, +, and -
    const cleaned = value.replace(/[^\d\s+-]/g, '');
    setFormData({
      ...formData,
      phone: cleaned,
    });
    if (errors.phone) {
      setErrors({
        ...errors,
        phone: undefined,
      });
    }
  };
  
  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setFormData({
      ...formData,
      postalCode: value,
    });
    if (errors.postalCode) {
      setErrors({
        ...errors,
        postalCode: undefined,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPayFastConfigured()) {
      showError('Payment processing is not available at this time. Please contact us directly.');
      return;
    }

    if (items.length === 0) {
      showError('Your cart is empty');
      return;
    }

    // Validate address
    const validation = validateAddress(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      showError('Please correct the errors in the form');
      return;
    }

    setIsProcessing(true);

    try {
      // Generate unique payment ID
      const paymentId = `TASSA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Generate PayFast checkout URL
      const checkoutUrl = generateCheckoutUrl({
        customerEmail: formData.email,
        customerFirstName: formData.firstName,
        customerLastName: formData.lastName,
        customerPhone: formData.phone,
        paymentId,
        items: items.map(item => ({
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        })),
        returnUrl: `${window.location.origin}/checkout/success?payment_id=${paymentId}`,
        cancelUrl: `${window.location.origin}/checkout/cancel`,
      });

      // Redirect to PayFast
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      showError('Failed to process checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-card text-card-foreground rounded-lg shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-6">
            Add some products to your cart before checking out.
          </p>
          <Button onClick={() => router.push('/products')}>
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const vat = subtotal * 0.15; // 15% VAT
  const total = subtotal + vat;

  // Payment methods available via PayFast
  const paymentMethods = [
    {
      id: 'credit_card',
      name: 'Credit/Debit Card',
      icon: '💳',
      description: 'Visa, Mastercard, American Express',
      processingTime: 'Instant',
      fees: 'No additional fees',
    },
    {
      id: 'eft',
      name: 'EFT / Bank Transfer',
      icon: '🏦',
      description: 'Direct bank transfer',
      processingTime: '2-3 business days',
      fees: 'No additional fees',
    },
    {
      id: 'instant_eft',
      name: 'Instant EFT',
      icon: '⚡',
      description: 'Immediate bank transfer',
      processingTime: 'Instant',
      fees: 'No additional fees',
    },
    {
      id: 'payfast_wallet',
      name: 'PayFast Wallet',
      icon: '👛',
      description: 'PayFast account balance',
      processingTime: 'Instant',
      fees: 'No additional fees',
    },
  ];

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(paymentMethods[0].id);

  // Shipping information
  const shippingInfo = {
    standard: '3-5 business days',
    express: '1-2 business days (select areas)',
    freeShippingThreshold: 5000, // R5000 for free shipping
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <div className="bg-card text-card-foreground rounded-lg shadow-sm p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-6">Shipping Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-secondary-600'
                  }`}
                  placeholder="082 123 4567 or +27821234567"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium mb-1">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.address ? 'border-red-500' : 'border-gray-300 dark:border-secondary-600'
                  }`}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-500">{errors.address}</p>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.city ? 'border-red-500' : 'border-gray-300 dark:border-secondary-600'
                    }`}
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-500">{errors.city}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="province" className="block text-sm font-medium mb-1">
                    Province <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="province"
                    name="province"
                    required
                    value={formData.province}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-secondary-700 ${
                      errors.province ? 'border-red-500' : 'border-gray-300 dark:border-secondary-600'
                    }`}
                  >
                    <option value="">Select Province</option>
                    {SA_PROVINCES.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                  {errors.province && (
                    <p className="mt-1 text-sm text-red-500">{errors.province}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium mb-1">
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    required
                    maxLength={4}
                    value={formData.postalCode}
                    onChange={handlePostalCodeChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.postalCode ? 'border-red-500' : 'border-gray-300 dark:border-secondary-600'
                    }`}
                    placeholder="1234"
                  />
                  {errors.postalCode && (
                    <p className="mt-1 text-sm text-red-500">{errors.postalCode}</p>
                  )}
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="pt-4">
                <label className="block text-sm font-medium mb-3">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        selectedPaymentMethod === method.id
                          ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-300 dark:border-secondary-600 hover:border-primary-400'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{method.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={method.id}
                              checked={selectedPaymentMethod === method.id}
                              onChange={() => setSelectedPaymentMethod(method.id)}
                              className="w-4 h-4 text-primary-600"
                            />
                            <span className="font-semibold">{method.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{method.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>⏱️ {method.processingTime}</span>
                            <span>💰 {method.fees}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Processing...' : `Proceed to Payment - R${total.toFixed(2)}`}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-card text-card-foreground rounded-lg shadow-sm p-6 sticky top-8">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span>{item.product.name} × {item.quantity}</span>
                  <span>R{(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t dark:border-secondary-700 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>R{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>VAT (15%)</span>
                <span>R{vat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t dark:border-secondary-700 pt-2">
                <span>Total</span>
                <span>R{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="mt-6 pt-6 border-t dark:border-secondary-700">
              <h3 className="font-semibold text-sm mb-2">Shipping Information</h3>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Standard delivery: 3-5 business days</p>
                <p>• Express delivery: 1-2 business days (select areas)</p>
                {subtotal >= 5000 ? (
                  <p className="text-green-600 dark:text-green-400 font-semibold">✓ Free shipping on this order!</p>
                ) : (
                  <p>• Free shipping on orders over R5,000</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

