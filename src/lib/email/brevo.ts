import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';
/**
 * Brevo (formerly Sendinblue) email integration
 * Handles transactional emails and marketing automation
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_API_URL = 'https://api.brevo.com/v3';

interface EmailOptions {
  to: string | string[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: number;
  params?: Record<string, any>;
  tags?: string[];
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a transactional email via Brevo API
 */
export async function sendEmail(options: EmailOptions): Promise<SendEmailResult> {
  if (!BREVO_API_KEY) {
    logWarn('Brevo API key not configured. Email not sent.');
    return {
      success: false,
      error: 'Brevo API key not configured',
    };
  }

  try {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    
    const payload: any = {
      sender: {
        name: 'TASSA - Twines and Straps SA',
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@twinesandstraps.co.za',
      },
      to: recipients.map(email => ({ email })),
      subject: options.subject,
    };

    // Use template or raw content
    if (options.templateId) {
      payload.templateId = options.templateId;
      if (options.params) {
        payload.params = options.params;
      }
    } else {
      if (options.htmlContent) {
        payload.htmlContent = options.htmlContent;
      }
      if (options.textContent) {
        payload.textContent = options.textContent;
      }
    }

    if (options.tags) {
      payload.tags = options.tags;
    }

    const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Api-Key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Brevo API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.messageId,
    };
  } catch (error) {
    logError('Failed to send email via Brevo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmation(
  email: string,
  orderDetails: {
    orderId: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    shippingAddress?: string;
  }
): Promise<SendEmailResult> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #E31E24; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; }
        .order-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Order Confirmation</h1>
        </div>
        <div class="content">
          <p>Thank you for your order!</p>
          <p>Your order <strong>#${orderDetails.orderId}</strong> has been received and is being processed.</p>
          
          <div class="order-details">
            <h3>Order Summary</h3>
            ${orderDetails.items.map(item => `
              <p>${item.name} × ${item.quantity} = R${(item.price * item.quantity).toFixed(2)}</p>
            `).join('')}
            <hr>
            <p><strong>Total: R${orderDetails.total.toFixed(2)}</strong></p>
          </div>
          
          ${orderDetails.shippingAddress ? `
            <div class="order-details">
              <h3>Shipping Address</h3>
              <p>${orderDetails.shippingAddress}</p>
            </div>
          ` : ''}
          
          <p>We'll send you another email when your order ships.</p>
        </div>
        <div class="footer">
          <p>TASSA - Twines and Straps SA</p>
          <p>If you have any questions, please contact us at ${process.env.BREVO_SENDER_EMAIL || 'info@twinesandstraps.co.za'}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Order Confirmation #${orderDetails.orderId}`,
    htmlContent,
    tags: ['order-confirmation'],
  });
}

/**
 * Send quote request confirmation email
 */
export async function sendQuoteConfirmation(
  email: string,
  quoteDetails: {
    quoteId: string;
    items: Array<{ name: string; quantity: number }>;
    message?: string;
  }
): Promise<SendEmailResult> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #E31E24; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; }
        .quote-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Quote Request Received</h1>
        </div>
        <div class="content">
          <p>Thank you for your quote request!</p>
          <p>We've received your quote request <strong>#${quoteDetails.quoteId}</strong> and our team will review it shortly.</p>
          
          <div class="quote-details">
            <h3>Requested Items</h3>
            ${quoteDetails.items.map(item => `
              <p>${item.name} × ${item.quantity}</p>
            `).join('')}
          </div>
          
          ${quoteDetails.message ? `
            <div class="quote-details">
              <h3>Your Message</h3>
              <p>${quoteDetails.message}</p>
            </div>
          ` : ''}
          
          <p>We'll get back to you within 24 hours with a personalized quote.</p>
        </div>
        <div class="footer">
          <p>TASSA - Twines and Straps SA</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Quote Request #${quoteDetails.quoteId} Received`,
    htmlContent,
    tags: ['quote-request'],
  });
}

/**
 * Check if Brevo is configured
 */
export function isBrevoConfigured(): boolean {
  return !!BREVO_API_KEY;
}

