export interface IMessagingService {
  /**
   * Generates a link to initiate a chat.
   * @param phoneNumber The recipient's phone number.
   * @param message The initial message content.
   */
  getChatLink(phoneNumber: string, message: string): string;
}
