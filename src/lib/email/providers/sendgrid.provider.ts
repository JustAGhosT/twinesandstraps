/**
 * SendGrid Email Provider
 * Implements IEmailProvider interface
 */

import { IEmailProvider, EmailOptions, SendEmailResult, EmailTemplate } from '../provider.interface';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3';

export class SendGridProvider implements IEmailProvider {
  readonly name = 'sendgrid';
  readonly displayName = 'SendGrid';

  isConfigured(): boolean {
    return !!SENDGRID_API_KEY;
  }

  async sendEmail(options: EmailOptions): Promise<SendEmailResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'SendGrid is not configured',
      };
    }

    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];

      const payload: any = {
        personalizations: [
          {
            to: recipients.map(email => ({ email })),
            subject: options.subject,
          },
        ],
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'noreply@twinesandstraps.co.za',
          name: process.env.SENDGRID_FROM_NAME || 'TASSA - Twines and Straps SA',
        },
        ...(options.replyTo && { reply_to: { email: options.replyTo } }),
      };

      // Use template or content
      if (options.templateId) {
        payload.template_id = options.templateId;
        if (options.templateParams) {
          payload.personalizations[0].dynamic_template_data = options.templateParams;
        }
      } else {
        if (options.htmlContent) {
          payload.content = [{ type: 'text/html', value: options.htmlContent }];
        }
        if (options.textContent) {
          payload.content = [
            ...(payload.content || []),
            { type: 'text/plain', value: options.textContent },
          ];
        }
      }

      // Add attachments
      if (options.attachments && options.attachments.length > 0) {
        payload.attachments = options.attachments.map(att => ({
          content: typeof att.content === 'string' 
            ? Buffer.from(att.content).toString('base64')
            : att.content.toString('base64'),
          filename: att.filename,
          type: att.contentType || 'application/octet-stream',
          disposition: 'attachment',
        }));
      }

      // Add categories (tags)
      if (options.tags && options.tags.length > 0) {
        payload.categories = options.tags;
      }

      const response = await fetch(`${SENDGRID_API_URL}/mail/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors?.[0]?.message || 'Failed to send email');
      }

      // SendGrid returns 202 Accepted with no body on success
      const messageId = response.headers.get('x-message-id') || `sg_${Date.now()}`;

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      logError('SendGrid email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  async sendBulkEmails(emails: EmailOptions[]): Promise<SendEmailResult[]> {
    const results: SendEmailResult[] = [];

    // SendGrid supports batch sending via personalizations
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
      const response = await fetch(`${SENDGRID_API_URL}/templates?generations=dynamic`, {
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return (data.templates || []).map((template: any) => ({
        id: template.id,
        name: template.name,
        subject: '', // SendGrid templates have subject in versions
        htmlContent: '',
        variables: [],
      }));
    } catch (error) {
      logError('SendGrid get templates error:', error);
      return [];
    }
  }

  getSenderEmail(): string {
    return process.env.SENDGRID_FROM_EMAIL || 'noreply@twinesandstraps.co.za';
  }

  getSenderName(): string {
    return process.env.SENDGRID_FROM_NAME || 'TASSA - Twines and Straps SA';
  }

  supportsBulkSending(): boolean {
    return true;
  }

  getSendingLimits(): {
    daily?: number;
    monthly?: number;
    perSecond?: number;
  } {
    // SendGrid free tier: 100/day, paid tiers vary
    return {
      daily: 100,
      monthly: 3000,
      perSecond: 10,
    };
  }
}

