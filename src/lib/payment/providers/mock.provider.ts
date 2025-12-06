/**
 * Mock Payment Provider
 * For testing and development purposes
 */

import { IPaymentProvider, PaymentRequest, PaymentResult, RefundRequest, RefundResult, WebhookPayload } from '../provider.interface';

export class MockPaymentProvider implements IPaymentProvider {
  readonly name = 'mock';
  readonly displayName = 'Mock Payment Provider';

  private mockPayments: Map<string, { status: string; amount: number }> = new Map();

  isConfigured(): boolean {
    return true; // Always available for testing
  }

  async initiatePayment(request: PaymentRequest): Promise<PaymentResult> {
    // Simulate payment initiation delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const paymentId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store mock payment
    this.mockPayments.set(paymentId, {
      status: 'pending',
      amount: request.amount,
    });

    // Return mock redirect URL
    return {
      success: true,
      paymentId,
      redirectUrl: `/checkout/mock-payment?paymentId=${paymentId}&orderId=${request.orderId}`,
    };
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
    const paymentId = (payload as any).paymentId || (payload as any).payment_id;
    const mockPayment = paymentId ? this.mockPayments.get(paymentId) : null;

    if (!mockPayment) {
      return {
        success: false,
        status: 'failed',
        error: 'Payment not found',
      };
    }

    // Simulate webhook processing
    const status = (payload as any).status || 'success';

    return {
      success: true,
      paymentId,
      orderId: (payload as any).orderId || (payload as any).order_id,
      status: status as 'success' | 'failed' | 'pending' | 'cancelled',
      amount: mockPayment.amount,
    };
  }

  async processRefund(request: RefundRequest): Promise<RefundResult> {
    const mockPayment = this.mockPayments.get(request.paymentId);

    if (!mockPayment) {
      return {
        success: false,
        error: 'Payment not found',
      };
    }

    // Simulate refund processing
    await new Promise(resolve => setTimeout(resolve, 200));

    const refundId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      refundId,
      amount: request.amount || mockPayment.amount,
    };
  }

  verifyWebhookSignature(payload: WebhookPayload, signature: string): boolean {
    // Mock always returns true for testing
    return true;
  }

  getSupportedPaymentMethods(): string[] {
    return ['mock_card', 'mock_eft', 'mock_wallet'];
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

