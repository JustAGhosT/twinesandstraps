/**
 * Azure Function for Post-Purchase Email Series Cron Job
 * Runs daily at 11:00 AM UTC to process post-purchase follow-up emails (Day 1, 3, 7)
 */

import { AzureFunction, Context } from '@azure/functions';

const cronSecret = process.env.CRON_SECRET;
const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
  const timeStamp = new Date().toISOString();

  if (myTimer.isPastDue) {
    context.log('Timer function is running late!');
  }

  context.log(`Post-purchase email series cron job started at: ${timeStamp}`);

  try {
    // Call the Next.js API endpoint
    const response = await fetch(`${apiUrl}/api/cron/post-purchase-emails`, {
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
    context.log('Post-purchase email series result:', result);

    if (result.success) {
      const { results } = result;
      context.log(`✅ Post-purchase emails processed:`);
      context.log(`   - Day 1: ${results.sentDay1} sent`);
      context.log(`   - Day 3: ${results.sentDay3} sent`);
      context.log(`   - Day 7: ${results.sentDay7} sent`);
      if (results.errors > 0) {
        context.log(`   ⚠️ Errors: ${results.errors}`);
      }
    } else {
      throw new Error(result.error || 'Post-purchase email series failed');
    }
  } catch (error: any) {
    context.log.error('Error in post-purchase email cron job:', error);
    throw error;
  }
};

export default timerTrigger;

