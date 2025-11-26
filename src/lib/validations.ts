import { z } from 'zod';

/**
 * Product validation schemas
 */
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255, 'Name too long'),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU too long'),
  description: z.string().min(1, 'Description is required'),
  material: z.string().max(100).nullable().optional(),
  diameter: z.number().positive('Diameter must be positive').nullable().optional(),
  length: z.number().positive('Length must be positive').nullable().optional(),
  strength_rating: z.string().max(50).nullable().optional(),
  price: z.number().positive('Price must be positive'),
  vat_applicable: z.boolean().default(true),
  stock_status: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).default('IN_STOCK'),
  image_url: z.string().url('Invalid image URL').nullable().optional(),
  category_id: z.number().int().positive('Valid category is required'),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

/**
 * Category validation schemas
 */
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name too long'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(100, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  parent_id: z.number().int().positive().nullable().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

/**
 * Admin authentication validation schemas
 */
export const loginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * User authentication validation schemas
 */
export const userRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20).optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  marketingConsent: z.boolean().default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;

/**
 * Site settings validation schema
 */
export const siteSettingsSchema = z.object({
  companyName: z.string().min(1).max(200).optional(),
  tagline: z.string().max(500).optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().max(50).optional(),
  whatsappNumber: z.string().regex(/^[0-9]+$/, 'WhatsApp number should only contain digits').optional(),
  address: z.string().max(500).optional(),
  businessHours: z.string().max(200).optional(),
  vatRate: z.string().regex(/^[0-9.]+$/, 'VAT rate must be a number').optional(),
  logoUrl: z.string().url().or(z.literal('')).optional(),
  socialFacebook: z.string().url().or(z.literal('')).optional(),
  socialInstagram: z.string().url().or(z.literal('')).optional(),
  socialLinkedIn: z.string().url().or(z.literal('')).optional(),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;

/**
 * Testimonial validation schema
 */
export const testimonialSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  company: z.string().max(100).optional(),
  role: z.string().max(100).optional(),
  content: z.string().min(10, 'Testimonial must be at least 10 characters').max(1000),
  rating: z.number().int().min(1).max(5),
  featured: z.boolean().default(false),
});

export type TestimonialInput = z.infer<typeof testimonialSchema>;

/**
 * Query parameter validation
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).optional(),
  sort: z.enum(['name', 'price', 'created_at', 'updated_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

/**
 * ID parameter validation
 */
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('Invalid ID'),
});

/**
 * Helper to validate and return parsed data or error response
 */
export function validateBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodIssue[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error.issues };
}

/**
 * Format Zod errors for API response
 */
export function formatZodErrors(errors: z.ZodIssue[]): Record<string, string> {
  const formatted: Record<string, string> = {};
  for (const error of errors) {
    const path = error.path.join('.');
    formatted[path || 'general'] = error.message;
  }
  return formatted;
}
