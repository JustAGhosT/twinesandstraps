/**
 * PayFast signature generation and validation
 * PayFast uses MD5 hashing for signature generation
 */

import crypto from 'crypto';

export interface PayFastData {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first?: string;
  name_last?: string;
  email_address: string;
  cell_number?: string;
  m_payment_id: string;
  amount: string;
  item_name: string;
  [key: string]: string | undefined;
}

/**
 * Generate MD5 signature for PayFast
 */
export function generateSignature(data: PayFastData, passphrase: string): string {
  // Create parameter string (exclude signature and empty values)
  const paramString = Object.keys(data)
    .filter(key => key !== 'signature' && data[key] !== undefined && data[key] !== '')
    .sort()
    .map(key => `${key}=${encodeURIComponent(data[key]!)}`)
    .join('&');

  // Add passphrase if provided
  const stringToHash = passphrase ? `${paramString}&passphrase=${encodeURIComponent(passphrase)}` : paramString;

  // Generate MD5 hash
  return crypto.createHash('md5').update(stringToHash).digest('hex');
}

/**
 * Validate PayFast signature from ITN (Instant Transaction Notification)
 */
export function validateSignature(data: Record<string, string>, passphrase: string): boolean {
  const receivedSignature = data.signature;
  if (!receivedSignature) {
    return false;
  }

  // Generate expected signature
  const expectedSignature = generateSignature(data as PayFastData, passphrase);

  // Compare signatures (case-insensitive)
  return receivedSignature.toLowerCase() === expectedSignature.toLowerCase();
}

/**
 * Parse PayFast ITN data
 */
export function parseITNData(formData: URLSearchParams): Record<string, string> {
  const data: Record<string, string> = {};
  formData.forEach((value, key) => {
    data[key] = value;
  });
  return data;
}

