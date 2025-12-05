/**
 * Azure Function for Low Stock Alert Cron Job
 * Runs daily at 9:00 AM UTC
 */

import { AzureFunction, Context } from '@azure/functions';

const cronSecret = process.env.CRON_SECRET;
const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
  const timeStamp = new Date().toISOString();

  if (myTimer.isPastDue) {
    context.log('Timer function is running late!');
  }

  context.log(`Low stock alert cron job started at: ${timeStamp}`);

  try {
    // Call the Next.js API endpoint
    const response = await fetch(`${apiUrl}/api/cron/low-stock-alert`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API call failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    context.log('Low stock alert result:', result);

    if (result.alertSent) {
      context.log(`✅ Low stock alert sent for ${result.productCount} product(s)`);
    } else if (result.productCount > 0) {
      context.log(`⚠️ Low stock detected (${result.productCount} products) but alert not sent`);
    } else {
      context.log('✅ No low stock products found');
    }
  } catch (error) {
    context.log.error('Error in low stock alert cron job:', error);
    throw error;
  }
};

export default timerTrigger;

