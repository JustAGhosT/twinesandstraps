/**
 * PayStack Payment Provider
 * Implements IPaymentProvider interface
 * Popular payment gateway in Africa
 */

import { IPaymentProvider, PaymentRequest, PaymentResult, RefundRequest, RefundResult, WebhookPayload } from '../provider.interface';

const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || '';
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_API_URL = 'https://api.paystack.co';

export class PayStackProvider implements IPaymentProvider {
  readonly name = 'paystack';
  readonly displayName = 'PayStack';

  isConfigured(): boolean {
    return !!(PAYSTACK_PUBLIC_KEY && PAYSTACK_SECRET_KEY);
  }

  async initiatePayment(request: PaymentRequest): Promise<PaymentResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'PayStack is not configured',
      };
    }

    try {
      // Calculate total amount in kobo (PayStack uses smallest currency unit)
      const amountInKobo = Math.round(request.amount * 100);

      const response = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: request.customer.email,
          amount: amountInKobo,
          currency: request.currency || 'ZAR',
          reference: request.orderNumber,
          callback_url: request.returnUrl,
          metadata: {
            orderId: request.orderId,
            orderNumber: request.orderNumber,
            customerName: request.customer.name,
            ...request.metadata,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to initialize payment');
      }

      const data = await response.json();

      return {
        success: true,
        paymentId: data.data.reference,
        redirectUrl: data.data.authorization_url,
      };
    } catch (error) {
      console.error('PayStack payment initiation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate payment',
      };
    }
  }

  async processWebhook(
    payload: WebhookPayload,
    signature?: string
  ): Promise<{
    success: boolean;
    paymentId?: string;
    orderId?: string;
    status: 'success' | 'failed' | 'pending' | 'cancelled';
    amount?: number;
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        status: 'failed',
        error: 'PayStack is not configured',
      };
    }

    try {
      // Verify webhook signature
      if (signature && !this.verifyWebhookSignature(payload, signature)) {
        return {
          success: false,
          status: 'failed',
          error: 'Invalid signature',
        };
      }

      const event = payload as any;
      const data = event.data;

      if (event.event === 'charge.success') {
        return {
          success: true,
          paymentId: data.reference,
          orderId: data.metadata?.orderNumber || data.reference,
          status: 'success',
          amount: data.amount / 100, // Convert from kobo
        };
      } else if (event.event === 'charge.failed') {
        return {
          success: true,
          paymentId: data.reference,
          orderId: data.metadata?.orderNumber || data.reference,
          status: 'failed',
          amount: data.amount / 100,
        };
      }

      return {
        success: true,
        paymentId: data.reference,
        status: 'pending',
      };
    } catch (error) {
      console.error('PayStack webhook processing error:', error);
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to process webhook',
      };
    }
  }

  async processRefund(request: RefundRequest): Promise<RefundResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'PayStack is not configured',
      };
    }

    try {
      const amountInKobo = request.amount ? Math.round(request.amount * 100) : undefined;

      const response = await fetch(`${PAYSTACK_API_URL}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction: request.paymentId,
          ...(amountInKobo && { amount: amountInKobo }),
          currency: 'ZAR',
          customer_note: request.reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Refund failed');
      }

      const data = await response.json();

      return {
        success: true,
        refundId: data.data.id,
        amount: data.data.amount / 100,
      };
    } catch (error) {
      console.error('PayStack refund error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process refund',
      };
    }
  }

  verifyWebhookSignature(payload: WebhookPayload, signature: string): boolean {
    if (!PAYSTACK_SECRET_KEY) {
      return false;
    }

    try {
      const crypto = require('crypto');
      const hash = crypto
        .createHmac('sha512', PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(payload))
        .digest('hex');

      return hash === signature;
    } catch (error) {
      console.error('PayStack signature verification error:', error);
      return false;
    }
  }

  getSupportedPaymentMethods(): string[] {
    return [
      'card',
      'bank',
      'ussd',
      'qr',
      'mobile_money',
      'bank_transfer',
    ];
  }

  getAmountLimits(): {
    min: number;
    max: number;
    currency: string;
  } {
    return {
      min: 0.01,
      max: 1000000,
      currency: 'ZAR',
    };
  }
}

