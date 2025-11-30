/**
 * Database types that mirror Prisma models
 * Used to avoid issues with @prisma/client type imports during build
 */

export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  material: string | null;
  diameter: number | null;
  length: number | null;
  strength_rating: string | null;
  price: number;
  vat_applicable: boolean;
  stock_status: string;
  image_url: string | null;
  created_at: Date;
  updated_at: Date;
  category_id: number;
  category?: Category;
  weight?: number | null;
  // 3rd party product fields
  is_third_party?: boolean;
  supplier_id?: number | null;
  supplier_sku?: string | null;
  supplier_price?: number | null;
  markup_percentage?: number | null;
  last_synced_at?: Date | null;
  supplier?: Supplier | null;
}

export interface Supplier {
  id: number;
  name: string;
  code: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  notes: string | null;
  default_markup: number;
  is_active: boolean;
  payment_terms: string | null;
  lead_time_days: number | null;
  min_order_value: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  products?: Product[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  role: string;
  marketing_consent: boolean;
  created_at: Date;
  last_login: Date | null;
}

/**
 * SafeUser type excludes sensitive fields like password_hash
 * Use this type for any user data sent to the client
 */
export type SafeUser = Omit<User, 'password_hash'>;

export type ProductWithCategory = Product & { category?: Category };
