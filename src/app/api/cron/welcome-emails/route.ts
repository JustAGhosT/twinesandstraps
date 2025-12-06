/**
 * Cron job endpoint for processing welcome email series
 * Should be called daily via Azure Functions or scheduled job
 */

import { NextRequest, NextResponse } from 'next/server';
import { processWelcomeEmailSeries } from '@/lib/email/welcome-series';
import { trackEvent } from '@/lib/monitoring/app-insights';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (!CRON_SECRET || providedSecret !== CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Track email series start
    trackEvent('WelcomeEmailSeriesStarted', {
      timestamp: new Date().toISOString(),
    });

    // Process welcome email series
    const results = await processWelcomeEmailSeries();

    // Track completion
    trackEvent('WelcomeEmailSeriesCompleted', {
      day1Sent: results.sentDay1,
      day3Sent: results.sentDay3,
      day7Sent: results.sentDay7,
      errors: results.errors,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error: any) {
    logError('Error in welcome email cron:', error);
    
    trackEvent('WelcomeEmailSeriesFailed', {
      error: error.message,
    });

    return NextResponse.json(
      { error: error.message || 'Failed to process welcome emails' },
      { status: 500 }
    );
  }
}

