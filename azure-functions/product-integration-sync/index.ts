/**
 * Azure Function for Product Integration Sync Cron Job
 * Runs hourly to sync product integrations (marketplaces and suppliers)
 */

import { AzureFunction, Context } from '@azure/functions';

const cronSecret = process.env.CRON_SECRET;
const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
  const timeStamp = new Date().toISOString();

  if (myTimer.isPastDue) {
    context.log('Timer function is running late!');
  }

  context.log(`Product integration sync cron job started at: ${timeStamp}`);

  try {
    // Call the Next.js API endpoint
    const response = await fetch(`${apiUrl}/api/cron/product-integration-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'X-Cron-Secret': cronSecret || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API call failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    context.log('Product integration sync result:', result);

    if (result.success) {
      context.log(`✅ Sync completed: ${result.succeeded}/${result.processed} succeeded, ${result.failed} failed`);
      if (result.errors && result.errors.length > 0) {
        context.log.warn(`⚠️ Errors encountered: ${result.errors.join(', ')}`);
      }
    } else {
      context.log.error('❌ Sync failed:', result.error);
    }
  } catch (error) {
    context.log.error('Error in product integration sync cron job:', error);
    throw error;
  }
};

export default timerTrigger;

