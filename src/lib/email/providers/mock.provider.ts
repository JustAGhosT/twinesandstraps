/**
 * Mock Email Provider
 * For testing and development purposes
 */

import { EmailOptions, EmailTemplate, IEmailProvider, SendEmailResult } from '../provider.interface';

export class MockEmailProvider implements IEmailProvider {
  readonly name = 'mock';
  readonly displayName = 'Mock Email Provider';

  private sentEmails: EmailOptions[] = [];

  isConfigured(): boolean {
    return true; // Always available for testing
  }

  async sendEmail(options: EmailOptions): Promise<SendEmailResult> {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 50));

    // Store sent email for testing
    this.sentEmails.push(options);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [MOCK EMAIL]', {
        to: options.to,
        subject: options.subject,
        hasHtml: !!options.htmlContent,
        hasText: !!options.textContent,
        templateId: options.templateId,
        tags: options.tags,
      });
    }

    const messageId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      messageId,
    };
  }

  async sendBulkEmails(emails: EmailOptions[]): Promise<SendEmailResult[]> {
    const results: SendEmailResult[] = [];

    for (const email of emails) {
      const result = await this.sendEmail(email);
      results.push(result);
    }

    return results;
  }

  async getTemplates(): Promise<EmailTemplate[]> {
    return [
      {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to TASSA!',
        htmlContent: '<h1>Welcome!</h1><p>Thank you for joining us.</p>',
        variables: ['firstName', 'lastName'],
      },
      {
        id: 'order-confirmation',
        name: 'Order Confirmation',
        subject: 'Order Confirmed - {{orderNumber}}',
        htmlContent: '<h1>Order Confirmed</h1><p>Your order {{orderNumber}} has been confirmed.</p>',
        variables: ['orderNumber', 'total'],
      },
    ];
  }

  getSenderEmail(): string {
    return 'noreply@mock.tassa.co.za';
  }

  getSenderName(): string {
    return 'TASSA - Mock';
  }

  supportsBulkSending(): boolean {
    return true;
  }

  getSendingLimits(): {
    daily?: number;
    monthly?: number;
    perSecond?: number;
  } {
    return {
      daily: 10000,
      monthly: 300000,
      perSecond: 100,
    };
  }

  // Helper method for testing - get sent emails
  getSentEmails(): EmailOptions[] {
    return [...this.sentEmails];
  }

  // Helper method for testing - clear sent emails
  clearSentEmails(): void {
    this.sentEmails = [];
  }
}

