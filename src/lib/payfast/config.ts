/**
 * PayFast payment gateway configuration
 * South Africa's most trusted payment gateway
 */

export const PAYFAST_CONFIG = {
  // Sandbox URLs for testing
  sandbox: {
    url: 'https://sandbox.payfast.co.za/eng/process',
    itnUrl: '/api/webhooks/payfast',
  },
  // Production URLs
  production: {
    url: 'https://www.payfast.co.za/eng/process',
    itnUrl: '/api/webhooks/payfast',
  },
};

// Get configuration based on environment
export function getPayFastConfig() {
  const isSandbox = process.env.PAYFAST_SANDBOX === 'true' || !process.env.PAYFAST_MERCHANT_ID;
  
  return {
    ...(isSandbox ? PAYFAST_CONFIG.sandbox : PAYFAST_CONFIG.production),
    merchantId: process.env.PAYFAST_MERCHANT_ID || '',
    merchantKey: process.env.PAYFAST_MERCHANT_KEY || '',
    passphrase: process.env.PAYFAST_PASSPHRASE || '',
    isSandbox,
  };
}

/**
 * Check if PayFast is configured
 */
export function isPayFastConfigured(): boolean {
  const config = getPayFastConfig();
  return !!(config.merchantId && config.merchantKey && config.passphrase);
}

