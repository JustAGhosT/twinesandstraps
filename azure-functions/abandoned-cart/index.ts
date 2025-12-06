/**
 * Azure Function for Abandoned Cart Automation Cron Job
 * Runs daily at 12:00 PM UTC to process abandoned cart reminders (24h, 48h, 72h)
 */

import { AzureFunction, Context } from '@azure/functions';

const cronSecret = process.env.CRON_SECRET;
const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
  const timeStamp = new Date().toISOString();

  if (myTimer.isPastDue) {
    context.log('Timer function is running late!');
  }

  context.log(`Abandoned cart automation cron job started at: ${timeStamp}`);

  try {
    // Call the Next.js API endpoint
    const response = await fetch(`${apiUrl}/api/cron/abandoned-cart`, {
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
    context.log('Abandoned cart automation result:', result);

    if (result.success) {
      const { results } = result;
      context.log(`✅ Abandoned cart reminders processed:`);
      context.log(`   - 24h reminders: ${results.sent24h} sent`);
      context.log(`   - 48h reminders: ${results.sent48h} sent`);
      context.log(`   - 72h reminders: ${results.sent72h} sent`);
      if (results.errors > 0) {
        context.log(`   ⚠️ Errors: ${results.errors}`);
      }
    } else {
      throw new Error(result.error || 'Abandoned cart automation failed');
    }
  } catch (error: any) {
    context.log.error('Error in abandoned cart cron job:', error);
    throw error;
  }
};

export default timerTrigger;

