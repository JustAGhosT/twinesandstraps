/**
 * PayFast Payment Provider
 * Implements IPaymentProvider interface
 */

import { generateCheckoutUrl } from '../../payfast/checkout';
import { getPayFastConfig, isPayFastConfigured } from '../../payfast/config';
import { processRefund as payfastRefund } from '../../payfast/refund';
import { parseITNData, validateSignature } from '../../payfast/signature';
import { IPaymentProvider, PaymentRequest, PaymentResult, RefundRequest, RefundResult, WebhookPayload } from '../provider.interface';

export class PayFastProvider implements IPaymentProvider {
  readonly name = 'payfast';
  readonly displayName = 'PayFast';

  isConfigured(): boolean {
    return isPayFastConfigured();
  }

  async initiatePayment(request: PaymentRequest): Promise<PaymentResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'PayFast is not configured',
      };
    }

    try {
      // Convert PaymentRequest to CheckoutOptions format
      const nameParts = request.customer.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const checkoutUrl = generateCheckoutUrl({
        customerEmail: request.customer.email,
        customerFirstName: firstName,
        customerLastName: lastName,
        customerPhone: request.customer.phone,
        paymentId: request.orderNumber, // Use order number as payment ID
        items: request.items.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        returnUrl: request.returnUrl,
        cancelUrl: request.cancelUrl,
        notifyUrl: request.metadata?.notifyUrl,
      });

      return {
        success: true,
        redirectUrl: checkoutUrl,
        paymentId: request.orderNumber,
      };
    } catch (error) {
      console.error('PayFast payment initiation error:', error);
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
        error: 'PayFast is not configured',
      };
    }

    try {
      const config = getPayFastConfig();

      // Parse ITN data if it's a FormData/URLSearchParams
      let itnData: Record<string, string>;
      if (payload instanceof FormData || payload instanceof URLSearchParams) {
        itnData = parseITNData(payload as any);
      } else {
        itnData = payload as Record<string, string>;
      }

      // Verify signature
      if (!this.verifyWebhookSignature(itnData, signature || itnData.signature || '')) {
        return {
          success: false,
          status: 'failed',
          error: 'Invalid signature',
        };
      }

      const paymentStatus = itnData.payment_status;
      const paymentId = itnData.m_payment_id;
      const amount = parseFloat(itnData.amount_gross || '0');

      let status: 'success' | 'failed' | 'pending' | 'cancelled' = 'pending';

      switch (paymentStatus) {
        case 'COMPLETE':
          status = 'success';
          break;
        case 'FAILED':
          status = 'failed';
          break;
        case 'CANCELLED':
          status = 'cancelled';
          break;
        case 'PENDING':
          status = 'pending';
          break;
        default:
          status = 'pending';
      }

      return {
        success: true,
        paymentId: itnData.pf_payment_id,
        orderId: paymentId,
        status,
        amount,
      };
    } catch (error) {
      console.error('PayFast webhook processing error:', error);
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
        error: 'PayFast is not configured',
      };
    }

    try {
      const result = await payfastRefund({
        pfPaymentId: request.paymentId,
        amount: request.amount,
        reason: request.reason,
      });

      return {
        success: result.success,
        refundId: result.refundId,
        amount: request.amount,
        error: result.error,
      };
    } catch (error) {
      console.error('PayFast refund error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process refund',
      };
    }
  }

  verifyWebhookSignature(payload: WebhookPayload, signature: string): boolean {
    if (!this.isConfigured() || !signature) {
      return false;
    }

    try {
      const config = getPayFastConfig();
      const itnData = payload instanceof FormData || payload instanceof URLSearchParams
        ? parseITNData(payload as any)
        : (payload as Record<string, string>);

      return validateSignature(itnData, config.passphrase);
    } catch (error) {
      console.error('PayFast signature verification error:', error);
      return false;
    }
  }

  getSupportedPaymentMethods(): string[] {
    return [
      'credit_card',
      'debit_card',
      'eft',
      'instant_eft',
      'payfast_wallet',
      'mobicred',
      'masterpass',
    ];
  }

  getAmountLimits(): {
    min: number;
    max: number;
    currency: string;
  } {
    return {
      min: 0.01, // R0.01 minimum
      max: 1000000, // R1,000,000 maximum (PayFast limit)
      currency: 'ZAR',
    };
  }
}

