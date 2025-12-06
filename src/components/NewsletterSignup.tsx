'use client';

import React, { useState } from 'react';
import { sendEmail, isBrevoConfigured } from '@/lib/email/brevo';
import { addToWelcomeSeries } from '@/lib/email/welcome-series';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

interface NewsletterSignupProps {
  variant?: 'footer' | 'inline';
}

const NewsletterSignup: React.FC<NewsletterSignupProps> = ({ variant = 'footer' }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');

    try {
      // Try to use Brevo if configured, otherwise fall back to localStorage
      if (isBrevoConfigured()) {
        // Send welcome email via Brevo
        const result = await sendEmail({
          to: email,
          subject: 'Welcome to TASSA Newsletter!',
          htmlContent: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #E31E24; color: white; padding: 20px; text-align: center; }
                .content { background-color: #f9f9f9; padding: 20px; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Welcome to TASSA!</h1>
                </div>
                <div class="content">
                  <p>Thank you for subscribing to our newsletter!</p>
                  <p>You'll now receive:</p>
                  <ul>
                    <li>Product updates and new arrivals</li>
                    <li>Special offers and promotions</li>
                    <li>Industry news and insights</li>
                    <li>Tips and best practices</li>
                  </ul>
                  <p>We're excited to have you on board!</p>
                </div>
                <div class="footer">
                  <p>TASSA - Twines and Straps SA</p>
                  <p>If you no longer wish to receive these emails, you can unsubscribe at any time.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          tags: ['newsletter-signup'],
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to subscribe');
        }

        // Add to welcome email series
        addToWelcomeSeries(email);
      } else {
        // Fallback to localStorage if Brevo not configured
        const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
        if (!subscribers.includes(email)) {
          subscribers.push(email);
          localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers));
        }
      }

      setStatus('success');
      setMessage('Thank you for subscribing! We\'ll keep you updated.');
      setEmail('');

      // Reset after 3 seconds
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 3000);
    } catch (error) {
      logError('Newsletter signup error:', error);
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  if (variant === 'footer') {
    return (
      <div className="bg-secondary-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Stay Updated</h3>
        <p className="text-gray-400 text-sm mb-4">
          Get product updates, industry news, and special offers delivered to your inbox.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-lg bg-secondary-700 border border-secondary-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              disabled={status === 'loading'}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
            >
              {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </button>
          </div>
          {message && (
            <p className={`text-sm ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {message}
            </p>
          )}
        </form>
        <p className="text-xs text-gray-500 mt-3">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    );
  }

  // Inline variant for other pages
  return (
    <div className="bg-primary-50 dark:bg-secondary-800 rounded-xl p-6 md:p-8">
      <div className="max-w-xl mx-auto text-center">
        <h3 className="text-xl font-bold text-secondary-900 mb-2">
          Subscribe to Our Newsletter
        </h3>
        <p className="text-accent-500 mb-4">
          Be the first to know about new products, special offers, and industry insights.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="flex-1 max-w-md px-4 py-3 rounded-lg border border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
        {message && (
          <p className={`text-sm mt-3 ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default NewsletterSignup;
