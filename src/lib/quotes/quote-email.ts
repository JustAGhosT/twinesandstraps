/**
 * Quote Email Sending
 * Sends quote PDFs and confirmation emails to customers
 */

import { sendEmail, isBrevoConfigured } from '../email/brevo';
import { getSiteUrl } from '../env';
import { getQuote } from './quote-management';
import { generateQuoteHTML } from './pdf-generation';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

export interface QuoteEmailData {
  quoteId: number;
  customerEmail: string;
  customerName: string;
  quoteNumber: string;
  pdfUrl?: string;
}

/**
 * Send quote confirmation email with PDF attachment
 */
export async function sendQuoteEmail(data: QuoteEmailData): Promise<boolean> {
  if (!isBrevoConfigured()) {
    logWarn('Brevo not configured. Quote email not sent.');
    return false;
  }

  const quote = await getQuote(data.quoteId);
  if (!quote) {
    logError('Quote not found:', data.quoteId);
    return false;
  }

  const siteUrl = getSiteUrl();
  const quoteUrl = `${siteUrl}/admin/quotes/${data.quoteId}`;
  const pdfUrl = data.pdfUrl || `${siteUrl}/api/admin/quotes/${data.quoteId}/pdf`;

  // Format quote items
  const itemsHtml = quote.items.map((item, index) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${index + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R${item.unit_price.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R${item.total_price.toFixed(2)}</td>
    </tr>
  `).join('');

  const expiryDate = quote.expires_at
    ? new Date(quote.expires_at).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Not specified';

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
        .cta-button { display: inline-block; background-color: #E31E24; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
        .items-table th { background-color: #f5f5f5; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .quote-summary { background: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .quote-summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .quote-summary-row:last-child { border-bottom: none; font-weight: bold; font-size: 1.1em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Quote from TASSA</h1>
        </div>
        <div class="content">
          <p>Hi ${data.customerName},</p>
          <p>Thank you for your interest in our products! We're pleased to provide you with a detailed quote for your requirements.</p>

          <div class="quote-summary">
            <p><strong>Quote Number:</strong> ${data.quoteNumber}</p>
            <p><strong>Valid Until:</strong> ${expiryDate}</p>
          </div>

          <p><strong>Quote Details:</strong></p>
          <table class="items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" style="text-align: right; font-weight: bold; padding: 10px;">Subtotal:</td>
                <td style="text-align: right; font-weight: bold; padding: 10px;">R${quote.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="4" style="text-align: right; font-weight: bold; padding: 10px;">VAT (15%):</td>
                <td style="text-align: right; font-weight: bold; padding: 10px;">R${quote.vat_amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="4" style="text-align: right; font-weight: bold; padding: 10px; font-size: 1.1em;">Total:</td>
                <td style="text-align: right; font-weight: bold; padding: 10px; font-size: 1.1em;">R${quote.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          ${quote.notes ? `<p><strong>Notes:</strong> ${quote.notes}</p>` : ''}

          <div style="text-align: center;">
            <a href="${pdfUrl}" class="cta-button">Download PDF Quote</a>
          </div>

          <p>To accept this quote and proceed with your order, please reply to this email or contact us directly.</p>

          <p>If you have any questions or need to discuss this quote, please don't hesitate to reach out to us.</p>

          <p>Best regards,<br>The TASSA Team</p>
        </div>
        <div class="footer">
          <p>TASSA - Twines and Straps SA</p>
          <p>Email: admin@tassa.co.za | Phone: +27 (0)63 969 0773</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const result = await sendEmail({
    to: data.customerEmail,
    subject: `Your Quote from TASSA - ${data.quoteNumber}`,
    htmlContent,
    tags: ['quote', 'b2b', `quote-${data.quoteNumber}`],
  });

  return result.success;
}

/**
 * Send quote request confirmation email
 */
export async function sendQuoteRequestConfirmation(
  customerEmail: string,
  customerName: string,
  quoteNumber: string
): Promise<boolean> {
  if (!isBrevoConfigured()) {
    logWarn('Brevo not configured. Quote confirmation email not sent.');
    return false;
  }

  const siteUrl = getSiteUrl();

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
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Quote Request Received</h1>
        </div>
        <div class="content">
          <p>Hi ${customerName},</p>
          <p>Thank you for your quote request! We've received your request and our team is working on preparing a detailed quote for you.</p>

          <p><strong>Quote Reference:</strong> ${quoteNumber}</p>

          <p>We'll review your requirements and get back to you within 24-48 hours with a comprehensive quote. If you have any urgent questions, please feel free to contact us directly.</p>

          <p>Best regards,<br>The TASSA Team</p>
        </div>
        <div class="footer">
          <p>TASSA - Twines and Straps SA</p>
          <p>Email: admin@tassa.co.za | Phone: +27 (0)63 969 0773</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const result = await sendEmail({
    to: customerEmail,
    subject: `Quote Request Received - ${quoteNumber}`,
    htmlContent,
    tags: ['quote-request', 'confirmation'],
  });

  return result.success;
}

