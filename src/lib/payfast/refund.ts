/**
 * PayFast refund API integration
 * Handles refunds for cancelled orders or customer requests
 */

import { getPayFastConfig, isPayFastConfigured } from './config';
import { generateSignature, type PayFastData } from './signature';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

export interface RefundRequest {
  pfPaymentId: string; // PayFast payment ID
  amount?: number; // Partial refund amount (optional, defaults to full refund)
  reason?: string; // Reason for refund
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
  message?: string;
}

/**
 * Process a refund via PayFast API
 */
export async function processRefund(request: RefundRequest): Promise<RefundResult> {
  if (!isPayFastConfigured()) {
    return {
      success: false,
      error: 'PayFast is not configured',
    };
  }

  const config = getPayFastConfig();

  try {
    // PayFast refund API endpoint
    const refundUrl = config.isSandbox
      ? 'https://sandbox.payfast.co.za/eng/query/refund'
      : 'https://www.payfast.co.za/eng/query/refund';

    // Prepare refund data
    const refundData: PayFastData = {
      merchant_id: config.merchantId,
      merchant_key: config.merchantKey,
      pf_payment_id: request.pfPaymentId,
      ...(request.amount && { amount: request.amount.toFixed(2) }),
    };

    // Generate signature
    const signature = generateSignature(refundData, config.passphrase);
    refundData.signature = signature;

    // Make refund request
    const formData = new URLSearchParams();
    Object.entries(refundData).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        formData.append(key, String(value));
      }
    });

    const response = await fetch(refundUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PayFast refund API error: ${response.statusText} - ${errorText}`);
    }

    const responseText = await response.text();
    
    // PayFast returns 'SUCCESS' or error message
    if (responseText.includes('SUCCESS')) {
      // Extract refund ID if available
      const refundIdMatch = responseText.match(/REFUND_ID=(\w+)/);
      return {
        success: true,
        refundId: refundIdMatch ? refundIdMatch[1] : undefined,
      };
    } else {
      return {
        success: false,
        error: responseText || 'Refund failed',
      };
    }
  } catch (error) {
    logError('PayFast refund error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check refund status
 */
export async function checkRefundStatus(pfPaymentId: string): Promise<{
  success: boolean;
  refunded: boolean;
  refundAmount?: number;
  error?: string;
}> {
  if (!isPayFastConfigured()) {
    return {
      success: false,
      refunded: false,
      error: 'PayFast is not configured',
    };
  }

  // This would require querying PayFast's transaction status API
  // For now, return a placeholder
  return {
    success: false,
    refunded: false,
    error: 'Refund status checking not yet implemented',
  };
}

