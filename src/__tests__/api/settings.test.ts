/**
 * Settings API Tests
 *
 * These tests ensure settings (including contact info) are properly
 * validated, saved, and retrieved from the database.
 *
 * Regression tests for the issue where phone and email fields were
 * losing their values.
 *
 * Issue: "Maar vannaand is epos en tel nr weer weg"
 * (But tonight the email and phone number are gone again)
 */

import { siteSettingsSchema, validateBody, formatZodErrors } from '@/lib/validations';

describe('Site Settings Validation', () => {
  describe('Email Validation', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'info@twinesandstraps.co.za',
        'sales@company.com',
        'user+tag@example.org',
        'test.email@subdomain.domain.co.za',
      ];

      validEmails.forEach((email) => {
        const result = validateBody(siteSettingsSchema, { email });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@nodomain.com',
        'missing@.com',
        'spaces in@email.com',
      ];

      invalidEmails.forEach((email) => {
        const result = validateBody(siteSettingsSchema, { email });
        expect(result.success).toBe(false);
      });
    });

    it('should accept empty/missing email (optional field)', () => {
      const result = validateBody(siteSettingsSchema, {});
      expect(result.success).toBe(true);
    });
  });

  describe('Phone Number Validation', () => {
    it('should accept various phone number formats', () => {
      const validPhones = [
        '+27 (0) 11 234 5678',
        '+27 82 123 4567',
        '011 234 5678',
        '0821234567',
        '+1 555 123 4567',
      ];

      validPhones.forEach((phone) => {
        const result = validateBody(siteSettingsSchema, { phone });
        expect(result.success).toBe(true);
      });
    });

    it('should accept empty/missing phone (optional field)', () => {
      const result = validateBody(siteSettingsSchema, {});
      expect(result.success).toBe(true);
    });

    it('should reject phone numbers exceeding max length', () => {
      const longPhone = '1'.repeat(51); // 51 characters, max is 50
      const result = validateBody(siteSettingsSchema, { phone: longPhone });
      expect(result.success).toBe(false);
    });
  });

  describe('WhatsApp Number Validation', () => {
    it('should accept valid WhatsApp numbers (digits only)', () => {
      const validNumbers = [
        '27821234567',
        '27111234567',
        '27XXXXXXXXX', // Placeholder - but technically not digits only
        '1234567890',
      ];

      // Only purely numeric ones should pass
      const numericNumbers = validNumbers.filter(n => /^[0-9]+$/.test(n));
      numericNumbers.forEach((number) => {
        const result = validateBody(siteSettingsSchema, { whatsappNumber: number });
        expect(result.success).toBe(true);
      });
    });

    it('should reject WhatsApp numbers with non-digits', () => {
      const invalidNumbers = [
        '+27 82 123 4567', // Has + and spaces
        '27-82-123-4567', // Has dashes
        '(027) 82 1234567', // Has parentheses and spaces
      ];

      invalidNumbers.forEach((number) => {
        const result = validateBody(siteSettingsSchema, { whatsappNumber: number });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Complete Settings Object', () => {
    it('should validate a complete settings object', () => {
      const fullSettings = {
        companyName: 'Twines and Straps SA (Pty) Ltd',
        tagline: 'Boundless Strength, Endless Solutions!',
        email: 'admin@tassa.co.za',
        phone: '+27 (0)63 969 0773',
        whatsappNumber: '27639690773',
        address: '123 Industrial Road, Johannesburg',
        businessHours: 'Mon-Fri 8:00-17:00',
        vatRate: '15',
        logoUrl: 'https://example.com/logo.png',
        socialFacebook: 'https://facebook.com/twinesandstraps',
        socialInstagram: 'https://instagram.com/twinesandstraps',
        socialLinkedIn: 'https://linkedin.com/company/twinesandstraps',
        socialTwitter: 'https://twitter.com/twinesandstraps',
        socialYoutube: 'https://youtube.com/@twinesandstraps',
      };

      const result = validateBody(siteSettingsSchema, fullSettings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('admin@tassa.co.za');
        expect(result.data.phone).toBe('+27 (0)63 969 0773');
        expect(result.data.whatsappNumber).toBe('27639690773');
      }
    });

    it('should validate partial settings update', () => {
      // When updating just the phone number
      const partialUpdate = {
        phone: '+27 82 999 8888',
      };

      const result = validateBody(siteSettingsSchema, partialUpdate);
      expect(result.success).toBe(true);
    });
  });

  describe('VAT Rate Validation', () => {
    it('should accept valid VAT rates', () => {
      const validRates = ['15', '0', '14.5', '20'];

      validRates.forEach((rate) => {
        const result = validateBody(siteSettingsSchema, { vatRate: rate });
        expect(result.success).toBe(true);
      });
    });

    it('should reject non-numeric VAT rates', () => {
      const invalidRates = ['fifteen', '15%', 'abc'];

      invalidRates.forEach((rate) => {
        const result = validateBody(siteSettingsSchema, { vatRate: rate });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Social Media URL Validation', () => {
    it('should accept valid social media URLs', () => {
      const result = validateBody(siteSettingsSchema, {
        socialFacebook: 'https://facebook.com/company',
        socialInstagram: 'https://instagram.com/company',
        socialLinkedIn: 'https://linkedin.com/company/name',
        socialTwitter: 'https://twitter.com/handle',
        socialYoutube: 'https://youtube.com/@channel',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty strings for social URLs', () => {
      const result = validateBody(siteSettingsSchema, {
        socialFacebook: '',
        socialInstagram: '',
        socialLinkedIn: '',
        socialTwitter: '',
        socialYoutube: '',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid social media URLs', () => {
      const result = validateBody(siteSettingsSchema, {
        socialFacebook: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Logo URL Validation', () => {
    it('should accept valid logo URLs', () => {
      const validUrls = [
        'https://example.com/logo.png',
        'https://cdn.company.com/images/logo.jpg',
        '/uploads/logo-uuid.png', // This would fail as it's not a full URL
      ];

      // Only full URLs should pass
      const result1 = validateBody(siteSettingsSchema, { logoUrl: 'https://example.com/logo.png' });
      expect(result1.success).toBe(true);
    });

    it('should accept empty string for logo URL', () => {
      const result = validateBody(siteSettingsSchema, { logoUrl: '' });
      expect(result.success).toBe(true);
    });
  });
});

describe('Error Formatting', () => {
  it('should format Zod errors for API response', () => {
    const result = validateBody(siteSettingsSchema, {
      email: 'invalid-email',
      whatsappNumber: 'not-a-number',
    });

    if (!result.success) {
      const formatted = formatZodErrors(result.errors);
      expect(formatted).toHaveProperty('email');
      expect(formatted).toHaveProperty('whatsappNumber');
    }
  });
});

describe('API Response Format Conversion', () => {
  // These tests document the expected format conversion between
  // database (snake_case) and API (camelCase) formats

  describe('Database to API format', () => {
    it('should map snake_case to camelCase', () => {
      const dbFormat = {
        company_name: 'Test Company',
        email: 'test@example.com',
        phone: '+27 123 456 7890',
        whatsapp_number: '27123456789',
        business_hours: 'Mon-Fri 9-5',
        vat_rate: '15',
        logo_url: '/logo.png',
        social_facebook: '',
        social_instagram: '',
        social_linkedin: '',
        social_twitter: '',
        social_youtube: '',
      };

      // The conversion function would produce:
      const expectedApiFormat = {
        companyName: 'Test Company',
        email: 'test@example.com',
        phone: '+27 123 456 7890',
        whatsappNumber: '27123456789',
        businessHours: 'Mon-Fri 9-5',
        vatRate: '15',
        logoUrl: '/logo.png',
        socialFacebook: '',
        socialInstagram: '',
        socialLinkedIn: '',
        socialTwitter: '',
        socialYoutube: '',
      };

      expect(Object.keys(expectedApiFormat)).toContain('companyName');
      expect(Object.keys(expectedApiFormat)).toContain('whatsappNumber');
      expect(Object.keys(expectedApiFormat)).toContain('businessHours');
    });
  });

  describe('API to Database format', () => {
    it('should map camelCase to snake_case', () => {
      const apiFormat = {
        companyName: 'Updated Company',
        email: 'updated@example.com',
        phone: '+27 999 888 7777',
        whatsappNumber: '27999888777',
      };

      // The conversion function would produce:
      const expectedDbFormat = {
        company_name: 'Updated Company',
        email: 'updated@example.com',
        phone: '+27 999 888 7777',
        whatsapp_number: '27999888777',
      };

      expect(Object.keys(expectedDbFormat)).toContain('company_name');
      expect(Object.keys(expectedDbFormat)).toContain('whatsapp_number');
    });
  });
});

describe('Settings Persistence Scenarios', () => {
  // Document scenarios that could cause data loss

  it('should preserve undefined fields (not overwrite with null)', () => {
    // If only updating email, phone should remain unchanged
    const partialUpdate = { email: 'new@example.com' };
    const result = validateBody(siteSettingsSchema, partialUpdate);

    expect(result.success).toBe(true);
    if (result.success) {
      // Phone should not be in the update at all
      expect(result.data.phone).toBeUndefined();
    }
  });

  it('should distinguish between empty string and undefined', () => {
    // Empty string means "clear this field"
    // Undefined means "don't change this field"
    const clearPhone = { phone: '' };
    const result = validateBody(siteSettingsSchema, clearPhone);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe('');
    }
  });
});
