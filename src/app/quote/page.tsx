'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useToast } from '@/components/Toast';

export default function QuotePage() {
  const { items, getTotalItems, getTotalPrice } = useCart();
  const { settings } = useSiteSettings();
  const { warning } = useToast();
  const hasItems = getTotalItems() > 0;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const whatsappNumber = settings.whatsappNumber;
    if (!whatsappNumber || whatsappNumber === '27XXXXXXXXX') {
      warning(`WhatsApp not configured. Please contact us at ${settings.email}`);
      setIsSubmitting(false);
      return;
    }

    // Build message
    let message = `*Quote Request from Website*\n\n`;
    message += `*Contact Details:*\n`;
    message += `Name: ${formData.name}\n`;
    message += `Email: ${formData.email}\n`;
    message += `Phone: ${formData.phone}\n`;
    if (formData.company) message += `Company: ${formData.company}\n`;
    message += `\n`;

    if (hasItems) {
      message += `*Products Requested:*\n`;
      items.forEach((item, index) => {
        message += `${index + 1}. ${item.product.name}${item.product.sku ? ` (SKU: ${item.product.sku})` : ''}\n`;
        message += `   Qty: ${item.quantity} × R${item.product.price.toFixed(2)} = R${(item.product.price * item.quantity).toFixed(2)}\n`;
      });
      message += `\n*Subtotal: R${getTotalPrice().toFixed(2)}*\n`;
      message += `(VAT to be added)\n\n`;
    }

    if (formData.message) {
      message += `*Additional Notes:*\n${formData.message}\n`;
    }

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    const popup = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      // Popup was blocked - provide fallback
      window.location.href = whatsappUrl;
    }
    setIsSubmitting(false);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-secondary-900 via-primary-600 to-secondary-900 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute h-full w-20 bg-black transform -skew-x-12"
              style={{ left: `${i * 12}%`, opacity: 0.3 }}
            />
          ))}
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Request a Quote</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Fill out the form below and we&apos;ll get back to you with a personalized quote.
          </p>
        </div>
      </section>

      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Quote Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
                <h2 className="text-2xl font-bold text-secondary-900 mb-6">Your Details</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="082 123 4567"
                      />
                    </div>
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="Your Company (optional)"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Requirements
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                      placeholder="Tell us about your specific requirements, quantities, delivery location, etc."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    {isSubmitting ? 'Opening WhatsApp...' : 'Send Quote Request via WhatsApp'}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    By submitting this form, your quote request will be sent to our team via WhatsApp for a faster response.
                  </p>
                </form>
              </div>
            </div>

            {/* Cart Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                <h3 className="text-lg font-bold text-secondary-900 mb-4">
                  {hasItems ? 'Products in Quote' : 'Your Cart'}
                </h3>

                {hasItems ? (
                  <>
                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                      {items.map((item) => (
                        <div key={item.product.id} className="flex justify-between items-start text-sm pb-3 border-b border-gray-100">
                          <div>
                            <p className="font-medium text-gray-900">{item.product.name}</p>
                            <p className="text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-medium text-gray-900">R{(item.product.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-bold text-secondary-900">
                        <span>Subtotal</span>
                        <span>R{getTotalPrice().toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">VAT to be added to final quote</p>
                    </div>
                    <Link
                      href="/cart"
                      className="block w-full text-center mt-4 py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Edit Cart
                    </Link>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-600 mb-4">No products selected</p>
                    <Link
                      href="/products"
                      className="inline-block bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                    >
                      Browse Products
                    </Link>
                  </div>
                )}

                {/* Contact Info */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-secondary-900 mb-3">Prefer to call?</h4>
                  <div className="space-y-2 text-sm">
                    <a href="tel:0741874975" className="flex items-center gap-2 text-gray-600 hover:text-primary-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      074 187 4975
                    </a>
                    <a href="mailto:info@twinesandstraps.co.za" className="flex items-center gap-2 text-gray-600 hover:text-primary-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      info@twinesandstraps.co.za
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
