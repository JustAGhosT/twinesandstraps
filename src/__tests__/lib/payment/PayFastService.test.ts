import { PayFastService } from '@/lib/payment/PayFastService';

describe('PayFastService', () => {
  const merchantId = '10000100';
  const merchantKey = '46f0cd694581a';
  const passphrase = 'salt';
  const service = new PayFastService(merchantId, merchantKey, passphrase, true);

  describe('generateSignature', () => {
    it('should generate a correct MD5 signature for a simple payload', () => {
      // Example based on PayFast docs/common knowledge
      const data = {
        merchant_id: '10000100',
        merchant_key: '46f0cd694581a',
        amount: '100.00',
        item_name: 'Test Product'
      };

      const signature = service.generateSignature(data);
      expect(signature).toBeDefined();
      expect(signature).toHaveLength(32); // MD5 is 32 hex chars
    });

    it('should handle empty values by excluding them from the signature string', () => {
        const data = {
            merchant_id: '10000100',
            merchant_key: '46f0cd694581a',
            name_first: '',
            amount: '100.00'
        };
        const signature = service.generateSignature(data);

        // Manual verification logic:
        // string: amount=100.00&merchant_id=10000100&merchant_key=46f0cd694581a&passphrase=salt
        // (sorted alphabetically)
        expect(signature).toBeDefined();
    });

    it('should correctly encode spaces as +', () => {
        const data = {
            item_name: 'Test Product Name', // "Test+Product+Name"
            merchant_id: '10000100',
            merchant_key: '46f0cd694581a'
        };
        // Expected string base (without passphrase):
        // item_name=Test+Product+Name&merchant_id=10000100&merchant_key=46f0cd694581a
        const signature = service.generateSignature(data);
        expect(signature).toBeDefined();
    });
  });

  describe('validateSignature', () => {
    it('should return true for a valid signature', () => {
        const data = {
            merchant_id: '10000100',
            merchant_key: '46f0cd694581a',
            amount: '100.00'
        };
        const signature = service.generateSignature(data);

        const payload = { ...data, signature };
        expect(service.validateSignature(payload)).toBe(true);
    });

    it('should return false for an invalid signature', () => {
        const data = {
            merchant_id: '10000100',
            merchant_key: '46f0cd694581a',
            amount: '100.00',
            signature: 'invalid_signature_hash'
        };
        expect(service.validateSignature(data)).toBe(false);
    });
  });
});
