/**
 * Welcome email series automation
 * Sends automated welcome emails to new customers/subscribers
 */

import { sendEmail, isBrevoConfigured } from './brevo';
import { getSiteUrl } from '../env';

export interface WelcomeEmailRecipient {
  email: string;
  firstName?: string;
  lastName?: string;
  signupDate: Date;
  emailsSent: number; // Track which emails in the series have been sent
}

/**
 * Store welcome email recipients (in production, use database)
 */
const welcomeRecipients = new Map<string, WelcomeEmailRecipient>();

/**
 * Add new subscriber to welcome series
 */
export function addToWelcomeSeries(email: string, firstName?: string, lastName?: string) {
  welcomeRecipients.set(email, {
    email,
    firstName,
    lastName,
    signupDate: new Date(),
    emailsSent: 0,
  });
}

/**
 * Get recipients who need welcome emails
 */
export function getRecipientsNeedingWelcomeEmail(day: 1 | 3 | 7): WelcomeEmailRecipient[] {
  const now = Date.now();
  const dayMs = day * 24 * 60 * 60 * 1000;

  return Array.from(welcomeRecipients.values()).filter((recipient) => {
    const daysSinceSignup = (now - recipient.signupDate.getTime()) / (24 * 60 * 60 * 1000);
    
    // Check if we've already sent this email
    if (day === 1 && recipient.emailsSent >= 1) return false;
    if (day === 3 && recipient.emailsSent < 1) return false; // Must have sent day 1 first
    if (day === 3 && recipient.emailsSent >= 2) return false;
    if (day === 7 && recipient.emailsSent < 2) return false; // Must have sent day 1 and 3 first
    if (day === 7 && recipient.emailsSent >= 3) return false;

    // Check if enough time has passed
    if (day === 1 && daysSinceSignup >= 1 && daysSinceSignup < 2) return true;
    if (day === 3 && daysSinceSignup >= 3 && daysSinceSignup < 4) return true;
    if (day === 7 && daysSinceSignup >= 7 && daysSinceSignup < 8) return true;

    return false;
  });
}

/**
 * Send welcome email (Day 1)
 */
export async function sendWelcomeEmailDay1(recipient: WelcomeEmailRecipient): Promise<boolean> {
  if (!isBrevoConfigured()) {
    console.warn('Brevo not configured. Welcome email not sent.');
    return false;
  }

  const siteUrl = getSiteUrl();
  const name = recipient.firstName || 'there';

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
          <h1>Welcome to TASSA!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Thank you for joining TASSA - Twines and Straps SA! We're thrilled to have you as part of our community.</p>
          
          <p>At TASSA, we specialize in providing high-quality twines and straps for all your binding and securing needs. Whether you're in construction, agriculture, shipping, or any industry that requires reliable fastening solutions, we've got you covered.</p>

          <div style="text-align: center;">
            <a href="${siteUrl}/products" class="cta-button">Browse Our Products</a>
          </div>

          <p><strong>What makes TASSA special?</strong></p>
          <ul>
            <li>Premium quality products sourced from trusted suppliers</li>
            <li>Competitive pricing with transparent VAT-inclusive pricing</li>
            <li>Fast and reliable shipping across South Africa</li>
            <li>Expert customer support ready to help you find the right solution</li>
          </ul>

          <p>If you have any questions or need assistance, don't hesitate to reach out to us. We're here to help!</p>

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
    to: recipient.email,
    subject: 'Welcome to TASSA - Your Trusted Source for Twines and Straps',
    htmlContent,
    tags: ['welcome-series', 'day-1'],
  });

  if (result.success) {
    recipient.emailsSent = 1;
  }

  return result.success;
}

/**
 * Send welcome email (Day 3)
 */
export async function sendWelcomeEmailDay3(recipient: WelcomeEmailRecipient): Promise<boolean> {
  if (!isBrevoConfigured()) {
    return false;
  }

  const siteUrl = getSiteUrl();
  const name = recipient.firstName || 'there';

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
          <h1>Discover More with TASSA</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>We hope you're finding everything you need on our website! As a valued member of the TASSA community, we wanted to share some helpful resources with you.</p>

          <p><strong>Need a custom quote?</strong></p>
          <p>If you're looking for bulk orders or have specific requirements, our quote system makes it easy to get a personalized price. Simply fill out our quote form and our team will get back to you promptly.</p>

          <div style="text-align: center;">
            <a href="${siteUrl}/quote" class="cta-button">Request a Quote</a>
          </div>

          <p><strong>Stay connected:</strong></p>
          <p>Follow us on social media for the latest updates, product tips, and industry news. We love hearing from our customers!</p>

          <p>Have questions? Our friendly support team is always ready to assist you.</p>

          <p>Best regards,<br>The TASSA Team</p>
        </div>
        <div class="footer">
          <p>TASSA - Twines and Straps SA</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const result = await sendEmail({
    to: recipient.email,
    subject: 'Discover More with TASSA - Custom Quotes & More',
    htmlContent,
    tags: ['welcome-series', 'day-3'],
  });

  if (result.success) {
    recipient.emailsSent = 2;
  }

  return result.success;
}

/**
 * Send welcome email (Day 7)
 */
export async function sendWelcomeEmailDay7(recipient: WelcomeEmailRecipient): Promise<boolean> {
  if (!isBrevoConfigured()) {
    return false;
  }

  const siteUrl = getSiteUrl();
  const name = recipient.firstName || 'there';

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
          <h1>Thank You for Being Part of TASSA!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>It's been a week since you joined TASSA, and we wanted to check in and make sure you're finding everything you need.</p>

          <p>We're committed to providing you with the best products and service. If you've made a purchase, we'd love to hear about your experience. Your feedback helps us improve and serve you better.</p>

          <div style="text-align: center;">
            <a href="${siteUrl}/contact" class="cta-button">Get in Touch</a>
          </div>

          <p><strong>Remember:</strong></p>
          <ul>
            <li>Free shipping on orders over R5,000</li>
            <li>Fast 3-5 business day delivery</li>
            <li>Expert support for all your questions</li>
            <li>Custom quotes for bulk orders</li>
          </ul>

          <p>Thank you for choosing TASSA. We look forward to serving you!</p>

          <p>Best regards,<br>The TASSA Team</p>
        </div>
        <div class="footer">
          <p>TASSA - Twines and Straps SA</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const result = await sendEmail({
    to: recipient.email,
    subject: 'Thank You for Being Part of TASSA!',
    htmlContent,
    tags: ['welcome-series', 'day-7'],
  });

  if (result.success) {
    recipient.emailsSent = 3;
  }

  return result.success;
}

/**
 * Process welcome email series (should be called by a scheduled job)
 */
export async function processWelcomeEmailSeries() {
  const day1Recipients = getRecipientsNeedingWelcomeEmail(1);
  const day3Recipients = getRecipientsNeedingWelcomeEmail(3);
  const day7Recipients = getRecipientsNeedingWelcomeEmail(7);

  const results = {
    sentDay1: 0,
    sentDay3: 0,
    sentDay7: 0,
    errors: 0,
  };

  // Send Day 1 emails
  for (const recipient of day1Recipients) {
    try {
      if (await sendWelcomeEmailDay1(recipient)) {
        results.sentDay1++;
      }
    } catch (error) {
      console.error('Error sending Day 1 welcome email:', error);
      results.errors++;
    }
  }

  // Send Day 3 emails
  for (const recipient of day3Recipients) {
    try {
      if (await sendWelcomeEmailDay3(recipient)) {
        results.sentDay3++;
      }
    } catch (error) {
      console.error('Error sending Day 3 welcome email:', error);
      results.errors++;
    }
  }

  // Send Day 7 emails
  for (const recipient of day7Recipients) {
    try {
      if (await sendWelcomeEmailDay7(recipient)) {
        results.sentDay7++;
      }
    } catch (error) {
      console.error('Error sending Day 7 welcome email:', error);
      results.errors++;
    }
  }

  return results;
}

