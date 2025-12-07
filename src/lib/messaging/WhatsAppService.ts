import { IMessagingService } from './IMessagingService';

export class WhatsAppService implements IMessagingService {
  getChatLink(phoneNumber: string, message: string): string {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  }
}

export class MockMessagingService implements IMessagingService {
  getChatLink(phoneNumber: string, message: string): string {
    // In a real mock scenario, this might log to console or return a local route
    console.log(`[MockMessaging] Generating link for ${phoneNumber}: ${message}`);
    return `javascript:alert('Mock WhatsApp: Sending "${message}" to ${phoneNumber}')`;
  }
}
