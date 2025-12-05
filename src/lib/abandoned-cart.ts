/**
 * Abandoned cart detection and recovery automation
 * Tracks carts and sends recovery emails via Brevo
 */

import { sendEmail, isBrevoConfigured } from './email/brevo';
import { getSiteUrl } from './env';

export interface AbandonedCart {
  email: string;
  items: Array<{
    productId: number;
    productName: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  lastUpdated: Date;
  reminderSent: number; // 0 = none, 1 = 24h, 2 = 48h, 3 = 72h
}

/**
 * Store abandoned carts (in production, use database)
 */
const abandonedCarts = new Map<string, AbandonedCart>();

/**
 * Track cart abandonment
 */
export function trackAbandonedCart(email: string, items: AbandonedCart['items'], total: number) {
  if (!email || items.length === 0) return;

  const cart: AbandonedCart = {
    email,
    items,
    total,
    lastUpdated: new Date(),
    reminderSent: 0,
  };

  abandonedCarts.set(email, cart);
}

/**
 * Mark cart as recovered (user completed purchase)
 */
export function markCartRecovered(email: string) {
  abandonedCarts.delete(email);
}

/**
 * Get abandoned carts that need reminders
 */
export function getCartsNeedingReminder(hoursSinceAbandonment: number): AbandonedCart[] {
  const now = Date.now();
  const threshold = hoursSinceAbandonment * 60 * 60 * 1000;

  return Array.from(abandonedCarts.values()).filter((cart) => {
    const timeSinceAbandonment = now - cart.lastUpdated.getTime();
    const needsReminder = timeSinceAbandonment >= threshold;
    
    // Check if we've already sent this reminder
    if (hoursSinceAbandonment === 24 && cart.reminderSent >= 1) return false;
    if (hoursSinceAbandonment === 48 && cart.reminderSent >= 2) return false;
    if (hoursSinceAbandonment === 72 && cart.reminderSent >= 3) return false;

    return needsReminder;
  });
}

/**
 * Send abandoned cart recovery email
 */
export async function sendAbandonedCartEmail(cart: AbandonedCart, hoursSinceAbandonment: number): Promise<boolean> {
  if (!isBrevoConfigured()) {
    console.warn('Brevo not configured. Abandoned cart email not sent.');
    return false;
  }

  const siteUrl = getSiteUrl();
  const urgencyText = hoursSinceAbandonment >= 72 
    ? 'Last chance!' 
    : hoursSinceAbandonment >= 48 
    ? 'Don\'t miss out!' 
    : 'Complete your purchase';

  const itemsHtml = cart.items.map((item, index) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${index + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R${item.price.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R${(item.price * item.quantity).toFixed(2)}</td>
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
          <h1>${urgencyText} - Complete Your Purchase</h1>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p>We noticed you left some items in your cart. Don't miss out on these great products!</p>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" style="text-align: right; font-weight: bold; padding: 10px;">Total:</td>
                <td style="text-align: right; font-weight: bold; padding: 10px;">R${cart.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <div style="text-align: center;">
            <a href="${siteUrl}/cart" class="cta-button">Complete Your Purchase</a>
          </div>

          <p>If you have any questions, feel free to contact us. We're here to help!</p>
        </div>
        <div class="footer">
          <p>TASSA - Twines and Straps SA</p>
          <p>This email was sent because you added items to your cart but didn't complete your purchase.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const result = await sendEmail({
    to: cart.email,
    subject: `${urgencyText} - Complete Your TASSA Purchase`,
    htmlContent,
    tags: ['abandoned-cart', `reminder-${hoursSinceAbandonment}h`],
  });

  if (result.success) {
    // Update reminder sent status
    if (hoursSinceAbandonment === 24) cart.reminderSent = 1;
    else if (hoursSinceAbandonment === 48) cart.reminderSent = 2;
    else if (hoursSinceAbandonment === 72) cart.reminderSent = 3;
  }

  return result.success;
}

/**
 * Process abandoned cart reminders (should be called by a scheduled job)
 */
export async function processAbandonedCartReminders() {
  const reminders24h = getCartsNeedingReminder(24);
  const reminders48h = getCartsNeedingReminder(48);
  const reminders72h = getCartsNeedingReminder(72);

  const results = {
    sent24h: 0,
    sent48h: 0,
    sent72h: 0,
    errors: 0,
  };

  // Send 24h reminders
  for (const cart of reminders24h) {
    try {
      if (await sendAbandonedCartEmail(cart, 24)) {
        results.sent24h++;
      }
    } catch (error) {
      console.error('Error sending 24h reminder:', error);
      results.errors++;
    }
  }

  // Send 48h reminders
  for (const cart of reminders48h) {
    try {
      if (await sendAbandonedCartEmail(cart, 48)) {
        results.sent48h++;
      }
    } catch (error) {
      console.error('Error sending 48h reminder:', error);
      results.errors++;
    }
  }

  // Send 72h reminders
  for (const cart of reminders72h) {
    try {
      if (await sendAbandonedCartEmail(cart, 72)) {
        results.sent72h++;
      }
    } catch (error) {
      console.error('Error sending 72h reminder:', error);
      results.errors++;
    }
  }

  return results;
}

