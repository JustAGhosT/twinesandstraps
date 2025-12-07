import crypto from 'crypto';
import { IPaymentGateway } from './IPaymentGateway';

export class PayFastService implements IPaymentGateway {
  private merchantId: string;
  private merchantKey: string;
  private passphrase?: string;
  private baseUrl: string;

  constructor(merchantId: string, merchantKey: string, passphrase?: string, isSandbox: boolean = false) {
    this.merchantId = merchantId;
    this.merchantKey = merchantKey;
    this.passphrase = passphrase;
    this.baseUrl = isSandbox
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';
  }

  /**
   * Generates the PayFast signature.
   * See: https://developers.payfast.co.za/docs#step-2-generate-a-signature
   */
  generateSignature(data: Record<string, string>): string {
    // 1. Sort the object by key
    const sortedKeys = Object.keys(data).sort();

    // 2. Create the query string
    let queryString = sortedKeys
      .filter((key) => key !== 'signature') // Exclude signature if present
      .filter((key) => data[key] !== '') // Exclude empty values
      .map((key) => {
        // Encode the value using encodeURIComponent but revert specific characters to match PHP urlencode
        // PayFast specific: spaces should be '+'
        const encodedValue = encodeURIComponent(data[key]!).replace(/%20/g, '+');
        return `${key}=${encodedValue}`;
      })
      .join('&');

    // 3. Append passphrase if it exists
    if (this.passphrase) {
      queryString += `&passphrase=${encodeURIComponent(this.passphrase).replace(/%20/g, '+')}`;
    }

    // 4. MD5 Hash
    return crypto.createHash('md5').update(queryString).digest('hex');
  }

  validateSignature(data: Record<string, string>): boolean {
    const { signature, ...rest } = data;
    if (!signature) return false;

    const calculatedSignature = this.generateSignature(rest);
    return calculatedSignature === signature;
  }

  getPaymentUrl(data: any): string {
    return this.baseUrl;
  }
}
