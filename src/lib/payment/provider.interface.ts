/**
 * Payment Provider Interface
 * All payment providers must implement this interface
 */

export interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  returnUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  redirectUrl?: string;
  error?: string;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number; // Partial refund if specified, full refund if not
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount?: number;
  error?: string;
}

export interface WebhookPayload {
  [key: string]: any;
}

export interface IPaymentProvider {
  /**
   * Provider identifier (e.g., 'payfast', 'paystack', 'stripe')
   */
  readonly name: string;

  /**
   * Human-readable provider name
   */
  readonly displayName: string;

  /**
   * Check if provider is configured and available
   */
  isConfigured(): boolean;

  /**
   * Initiate payment and get redirect URL
   */
  initiatePayment(request: PaymentRequest): Promise<PaymentResult>;

  /**
   * Process payment webhook/callback
   */
  processWebhook(payload: WebhookPayload, signature?: string): Promise<{
    success: boolean;
    paymentId?: string;
    orderId?: string;
    status: 'success' | 'failed' | 'pending' | 'cancelled';
    amount?: number;
    error?: string;
  }>;

  /**
   * Process refund
   */
  processRefund(request: RefundRequest): Promise<RefundResult>;

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: WebhookPayload, signature: string): boolean;

  /**
   * Get supported payment methods
   */
  getSupportedPaymentMethods(): string[];

  /**
   * Get minimum/maximum transaction amounts
   */
  getAmountLimits(): {
    min: number;
    max: number;
    currency: string;
  };
}

