/**
 * Low Stock Alert System
 * Detects products with low stock and sends alerts
 */

import prisma from '@/lib/prisma';
import { STOCK_STATUS } from '@/constants';
import { sendEmail } from '@/lib/email/brevo';
import { logError, logWarn } from '@/lib/logging/logger';

export interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  stock_status: string;
  category: {
    name: string;
  };
}

export interface LowStockAlert {
  products: LowStockProduct[];
  totalCount: number;
  criticalCount: number; // OUT_OF_STOCK
  warningCount: number; // LOW_STOCK
}

/**
 * Get all products with low stock
 */
export async function getLowStockProducts(): Promise<LowStockAlert> {
  const lowStockProducts = await prisma.product.findMany({
    where: {
      stock_status: {
        in: [STOCK_STATUS.LOW_STOCK, STOCK_STATUS.OUT_OF_STOCK],
      },
    },
    include: {
      category: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [
      { stock_status: 'asc' }, // OUT_OF_STOCK first
      { name: 'asc' },
    ],
  });

  const criticalCount = lowStockProducts.filter(
    (p) => p.stock_status === STOCK_STATUS.OUT_OF_STOCK
  ).length;

  const warningCount = lowStockProducts.filter(
    (p) => p.stock_status === STOCK_STATUS.LOW_STOCK
  ).length;

  return {
    products: lowStockProducts as LowStockProduct[],
    totalCount: lowStockProducts.length,
    criticalCount,
    warningCount,
  };
}

/**
 * Send low stock alert email to admin
 */
export async function sendLowStockAlert(
  adminEmail: string,
  alert: LowStockAlert
): Promise<boolean> {
  if (alert.totalCount === 0) {
    return true; // No alert needed
  }

  const criticalProducts = alert.products.filter(
    (p) => p.stock_status === STOCK_STATUS.OUT_OF_STOCK
  );
  const warningProducts = alert.products.filter(
    (p) => p.stock_status === STOCK_STATUS.LOW_STOCK
  );

  const emailBody = `
    <h2>Low Stock Alert</h2>
    <p>You have <strong>${alert.totalCount}</strong> product(s) that need attention:</p>
    
    ${criticalProducts.length > 0 ? `
      <h3 style="color: #dc2626;">🚨 Out of Stock (${criticalProducts.length})</h3>
      <ul>
        ${criticalProducts.map(
          (p) => `<li><strong>${p.name}</strong> (SKU: ${p.sku}) - Category: ${p.category.name}</li>`
        ).join('')}
      </ul>
    ` : ''}
    
    ${warningProducts.length > 0 ? `
      <h3 style="color: #f59e0b;">⚠️ Low Stock (${warningProducts.length})</h3>
      <ul>
        ${warningProducts.map(
          (p) => `<li><strong>${p.name}</strong> (SKU: ${p.sku}) - Category: ${p.category.name}</li>`
        ).join('')}
      </ul>
    ` : ''}
    
    <p>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/products?status=LOW_STOCK" 
         style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">
        View Low Stock Products
      </a>
    </p>
    
    <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
      This is an automated alert. You can manage stock alerts in your admin settings.
    </p>
  `;

  try {
    await sendEmail({
      to: adminEmail,
      subject: `Low Stock Alert: ${alert.totalCount} product(s) need attention`,
      html: emailBody,
    });
    return true;
  } catch (error) {
    logError('Failed to send low stock alert', error, { adminEmail });
    return false;
  }
}

/**
 * Check and send low stock alerts
 * This should be called by a cron job
 */
export async function checkAndSendLowStockAlerts(adminEmail?: string): Promise<{
  success: boolean;
  alertSent: boolean;
  productCount: number;
}> {
  try {
    const alert = await getLowStockProducts();

    if (alert.totalCount === 0) {
      return {
        success: true,
        alertSent: false,
        productCount: 0,
      };
    }

    // Get admin email from settings if not provided
    let emailToUse = adminEmail;
    if (!emailToUse) {
      // Try to get from site settings
      const settings = await prisma.siteSettings.findFirst();
      if (settings?.email) {
        emailToUse = settings.email;
      }
    }

    if (!emailToUse) {
      logWarn('No admin email configured for low stock alerts');
      return {
        success: false,
        alertSent: false,
        productCount: alert.totalCount,
      };
    }

    const emailSent = await sendLowStockAlert(emailToUse, alert);

    return {
      success: true,
      alertSent: emailSent,
      productCount: alert.totalCount,
    };
  } catch (error) {
    logError('Error checking low stock', error);
    return {
      success: false,
      alertSent: false,
      productCount: 0,
    };
  }
}

