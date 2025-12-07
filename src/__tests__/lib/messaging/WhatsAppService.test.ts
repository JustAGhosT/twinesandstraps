import { WhatsAppService } from '@/lib/messaging/WhatsAppService';

describe('WhatsAppService', () => {
  const service = new WhatsAppService();

  describe('getChatLink', () => {
    it('should generate a valid wa.me link with encoded message', () => {
      const phone = '27123456789';
      const message = 'Hello World';
      const link = service.getChatLink(phone, message);

      expect(link).toBe('https://wa.me/27123456789?text=Hello%20World');
    });

    it('should handle special characters in message', () => {
      const phone = '27123456789';
      const message = 'Price: R100.00 & VAT';
      const link = service.getChatLink(phone, message);

      expect(link).toContain('text=Price%3A%20R100.00%20%26%20VAT');
    });
  });
});
