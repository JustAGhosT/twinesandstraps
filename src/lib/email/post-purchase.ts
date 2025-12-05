/**
 * Post-purchase email automation
 * Sends follow-up emails after order completion
 */

import { sendEmail, isBrevoConfigured } from './brevo';
import { getSiteUrl } from '../env';

export interface PostPurchaseOrder {
  orderId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  orderDate: Date;
  trackingNumber?: string;
}

/**
 * Send post-purchase follow-up email (Day 1)
 */
export async function sendPostPurchaseEmailDay1(order: PostPurchaseOrder): Promise<boolean> {
  if (!isBrevoConfigured()) {
    console.warn('Brevo not configured. Post-purchase email not sent.');
    return false;
  }

  const siteUrl = getSiteUrl();
  const name = order.firstName || 'Valued Customer';

  const itemsHtml = order.items.map((item, index) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${index + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Thank You for Your Order!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Thank you for your order! We're excited to get your items to you as soon as possible.</p>

          <p><strong>Order Details:</strong></p>
          <p>Order ID: <strong>${order.orderId}</strong></p>
          <p>Order Date: ${order.orderDate.toLocaleDateString()}</p>

          <table class="items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="text-align: right; font-weight: bold; padding: 10px;">Total:</td>
                <td style="text-align: right; font-weight: bold; padding: 10px;">R${order.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          ${order.trackingNumber ? `
            <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
            <div style="text-align: center;">
              <a href="${siteUrl}/orders/${order.orderId}" class="cta-button">Track Your Order</a>
            </div>
          ` : `
            <p>We'll send you a tracking number as soon as your order ships. You can also check your order status anytime.</p>
            <div style="text-align: center;">
              <a href="${siteUrl}/orders/${order.orderId}" class="cta-button">View Order Details</a>
            </div>
          `}

          <p>If you have any questions about your order, please don't hesitate to contact us.</p>

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

  return (await sendEmail({
    to: order.email,
    subject: `Thank You for Your Order #${order.orderId}`,
    htmlContent,
    tags: ['post-purchase', 'order-confirmation'],
  })).success;
}

/**
 * Send post-purchase follow-up email (Day 3) - Request review
 */
export async function sendPostPurchaseEmailDay3(order: PostPurchaseOrder): Promise<boolean> {
  if (!isBrevoConfigured()) {
    return false;
  }

  const siteUrl = getSiteUrl();
  const name = order.firstName || 'Valued Customer';

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
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>How Was Your Experience?</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>We hope you're enjoying your TASSA products! Your feedback is incredibly valuable to us and helps us improve our service.</p>

          <p>We'd love to hear about your experience:</p>
          <ul>
            <li>How was the quality of the products?</li>
            <li>Was the ordering process smooth?</li>
            <li>How was the delivery experience?</li>
            <li>Any suggestions for improvement?</li>
          </ul>

          <div style="text-align: center;">
            <a href="${siteUrl}/contact" class="cta-button">Share Your Feedback</a>
          </div>

          <p>Thank you for choosing TASSA. We appreciate your business!</p>

          <p>Best regards,<br>The TASSA Team</p>
        </div>
        <div class="footer">
          <p>TASSA - Twines and Straps SA</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return (await sendEmail({
    to: order.email,
    subject: 'How Was Your TASSA Experience?',
    htmlContent,
    tags: ['post-purchase', 'review-request'],
  })).success;
}

/**
 * Send post-purchase follow-up email (Day 7) - Related products
 */
export async function sendPostPurchaseEmailDay7(order: PostPurchaseOrder): Promise<boolean> {
  if (!isBrevoConfigured()) {
    return false;
  }

  const siteUrl = getSiteUrl();
  const name = order.firstName || 'Valued Customer';

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
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Discover More TASSA Products</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Thank you for being a valued TASSA customer! We wanted to let you know about some other products that might interest you.</p>

          <p>Based on your recent purchase, you might also like:</p>
          <ul>
            <li>Related twines and straps in different sizes</li>
            <li>Complementary fastening solutions</li>
            <li>Bulk order discounts for repeat customers</li>
          </ul>

          <div style="text-align: center;">
            <a href="${siteUrl}/products" class="cta-button">Browse All Products</a>
          </div>

          <p><strong>Special Offer:</strong> Get free shipping on orders over R5,000!</p>

          <p>If you need any assistance or have questions, we're here to help.</p>

          <p>Best regards,<br>The TASSA Team</p>
        </div>
        <div class="footer">
          <p>TASSA - Twines and Straps SA</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return (await sendEmail({
    to: order.email,
    subject: 'Discover More TASSA Products',
    htmlContent,
    tags: ['post-purchase', 'related-products'],
  })).success;
}

