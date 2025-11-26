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

export type ProductWithCategory = Product & { category?: Category };
