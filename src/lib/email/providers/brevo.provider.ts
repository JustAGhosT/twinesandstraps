/**
 * Brevo (formerly Sendinblue) Email Provider
 * Implements IEmailProvider interface
 */

import { IEmailProvider, EmailOptions, SendEmailResult, EmailTemplate } from '../provider.interface';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_API_URL = 'https://api.brevo.com/v3';

export class BrevoProvider implements IEmailProvider {
  readonly name = 'brevo';
  readonly displayName = 'Brevo';

  isConfigured(): boolean {
    return !!BREVO_API_KEY;
  }

  async sendEmail(options: EmailOptions): Promise<SendEmailResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Brevo is not configured',
      };
    }

    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      
      const payload: any = {
        sender: {
          name: process.env.BREVO_SENDER_NAME || 'TASSA - Twines and Straps SA',
          email: process.env.BREVO_SENDER_EMAIL || 'noreply@twinesandstraps.co.za',
        },
        to: recipients.map(email => ({ email })),
        subject: options.subject,
      };

      // Use template or raw content
      if (options.templateId) {
        payload.templateId = typeof options.templateId === 'number' 
          ? options.templateId 
          : parseInt(options.templateId);
        if (options.params) {
          payload.params = options.params;
        }
      } else {
        if (options.htmlContent) {
          payload.htmlContent = options.htmlContent;
        }
        if (options.textContent) {
          payload.textContent = options.textContent;
        }
      }

      if (options.tags) {
        payload.tags = options.tags;
      }

      const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Api-Key': BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Brevo API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.messageId,
      };
    } catch (error) {
      logError('Failed to send email via Brevo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendBulkEmails(emails: EmailOptions[]): Promise<SendEmailResult[]> {
    const results: SendEmailResult[] = [];

    // Brevo supports batch sending via transactional email API
    // For simplicity, send individually (can be optimized later)
    for (const email of emails) {
      const result = await this.sendEmail(email);
      results.push(result);
    }

    return results;
  }

  async getTemplates(): Promise<EmailTemplate[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const response = await fetch(`${BREVO_API_URL}/smtp/templates`, {
        headers: {
          'Api-Key': BREVO_API_KEY,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return (data.templates || []).map((template: any) => ({
        id: template.id.toString(),
        name: template.name,
        subject: template.subject || '',
        htmlContent: template.htmlContent || '',
        variables: template.variables || [],
      }));
    } catch (error) {
      logError('Brevo get templates error:', error);
      return [];
    }
  }

  getSenderEmail(): string {
    return process.env.BREVO_SENDER_EMAIL || 'noreply@twinesandstraps.co.za';
  }

  getSenderName(): string {
    return process.env.BREVO_SENDER_NAME || 'TASSA - Twines and Straps SA';
  }

  supportsBulkSending(): boolean {
    return true;
  }

  getSendingLimits(): {
    daily?: number;
    monthly?: number;
    perSecond?: number;
  } {
    // Brevo free tier: 300/day, paid tiers vary
    return {
      daily: 300,
      monthly: 9000,
      perSecond: 5,
    };
  }
}

