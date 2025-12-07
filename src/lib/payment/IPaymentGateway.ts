export interface IPaymentGateway {
  /**
   * Generates the signature required by the payment gateway.
   * @param data - The payload data to sign.
   * @param passphrase - The secret passphrase (optional, depending on gateway).
   */
  generateSignature(data: Record<string, string>, passphrase?: string): string;

  /**
   * Validates the signature of an incoming notification (ITN/Webhook).
   * @param data - The received data including the signature.
   * @param passphrase - The secret passphrase.
   */
  validateSignature(data: Record<string, string>, passphrase?: string): boolean;

  /**
   * Constructs the full redirect URL or form payload.
   */
  getPaymentUrl(data: any): string;
}
