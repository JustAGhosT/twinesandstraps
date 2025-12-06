/**
 * Email Provider Interface
 * All email providers must implement this interface
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: string | number;
  templateParams?: Record<string, any>;
  tags?: string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailTemplate {
  id: string | number;
  name: string;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  variables?: string[];
}

export interface IEmailProvider {
  /**
   * Provider identifier (e.g., 'brevo', 'sendgrid', 'ses')
   */
  readonly name: string;

  /**
   * Human-readable provider name
   */
  readonly displayName: string;

  /**
   * Check if provider is configured and available
   */
  isConfigured(): boolean;

  /**
   * Send a single email
   */
  sendEmail(options: EmailOptions): Promise<SendEmailResult>;

  /**
   * Send bulk emails
   */
  sendBulkEmails(emails: EmailOptions[]): Promise<SendEmailResult[]>;

  /**
   * Get available email templates
   */
  getTemplates(): Promise<EmailTemplate[]>;

  /**
   * Get sender email address
   */
  getSenderEmail(): string;

  /**
   * Get sender name
   */
  getSenderName(): string;

  /**
   * Check if provider supports bulk sending
   */
  supportsBulkSending(): boolean;

  /**
   * Get daily/monthly sending limits
   */
  getSendingLimits(): {
    daily?: number;
    monthly?: number;
    perSecond?: number;
  };
}

