/**
 * Address validation utilities for South African addresses
 */

import { z } from 'zod';

// South African provinces
export const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
] as const;

// Postal code validation (South African postal codes are 4 digits)
const postalCodeRegex = /^\d{4}$/;

// Phone number validation (South African format)
const phoneRegex = /^(\+27|0)[1-9]\d{8}$/;

export const addressSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(phoneRegex, 'Invalid phone number. Use format: 082 123 4567 or +27821234567'),
  address: z.string().min(5, 'Street address must be at least 5 characters').max(255),
  city: z.string().min(2, 'City is required').max(100),
  province: z.enum(SA_PROVINCES, {
    errorMap: () => ({ message: 'Please select a valid province' }),
  }),
  postalCode: z.string().regex(postalCodeRegex, 'Postal code must be 4 digits'),
});

export type AddressFormData = z.infer<typeof addressSchema>;

/**
 * Validate South African postal code format
 */
export function validatePostalCode(postalCode: string): boolean {
  return postalCodeRegex.test(postalCode);
}

/**
 * Validate South African phone number
 */
export function validatePhoneNumber(phone: string): boolean {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');
  return phoneRegex.test(cleaned);
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, '');
  
  // Convert +27 to 0
  if (cleaned.startsWith('+27')) {
    const number = '0' + cleaned.substring(3);
    return formatPhoneNumber(number);
  }
  
  // Format as 0XX XXX XXXX
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
  }
  
  return phone;
}

/**
 * Get validation errors for address form
 */
export function validateAddress(data: Partial<AddressFormData>): {
  isValid: boolean;
  errors: Partial<Record<keyof AddressFormData, string>>;
} {
  const result = addressSchema.safeParse(data);
  
  if (result.success) {
    return { isValid: true, errors: {} };
  }
  
  const errors: Partial<Record<keyof AddressFormData, string>> = {};
  result.error.errors.forEach((error) => {
    const field = error.path[0] as keyof AddressFormData;
    if (field) {
      errors[field] = error.message;
    }
  });
  
  return { isValid: false, errors };
}

