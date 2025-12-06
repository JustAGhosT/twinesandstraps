import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/admin-auth';
import { productImportRowSchema, validateBody, formatZodErrors } from '@/lib/validations';
import { z } from 'zod';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

interface RouteParams {
  params: { id: string };
}

// Schema for the import request
const importRequestSchema = z.object({
  products: z.array(z.unknown()).min(1, 'At least one product is required'),
  options: z.object({
    updateExisting: z.boolean().default(true), // Update products with matching supplier_sku
    useSupplierMarkup: z.boolean().default(true), // Use supplier's default markup
    customMarkup: z.number().min(0).max(500).optional(), // Override markup
    defaultCategoryId: z.number().int().positive().optional(), // Default category for products without one
  }).optional(),
});

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: Array<{ row: number; field?: string; message: string }>;
  created: Array<{ id: number; name: string; sku: string }>;
  updated: Array<{ id: number; name: string; sku: string }>;
}

// POST - Import products for a supplier
export async function POST(request: NextRequest, { params }: RouteParams) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const supplierId = parseInt(params.id);
    if (isNaN(supplierId) || supplierId <= 0) {
      return NextResponse.json({ error: 'Invalid supplier ID' }, { status: 400 });
    }

    // Get supplier
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    if (!supplier.is_active) {
      return NextResponse.json({ error: 'Supplier is not active' }, { status: 400 });
    }

    const body = await request.json();
    const requestValidation = validateBody(importRequestSchema, body);
    if (!requestValidation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: formatZodErrors(requestValidation.errors) },
        { status: 400 }
      );
    }

    const { products: rawProducts, options } = requestValidation.data;
    const updateExisting = options?.updateExisting ?? true;
    const useSupplierMarkup = options?.useSupplierMarkup ?? true;
    const markup = options?.customMarkup ?? (useSupplierMarkup ? supplier.default_markup : 30);
    const defaultCategoryId = options?.defaultCategoryId;

    // Get all categories for name matching
    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));
    const categorySlugMap = new Map(categories.map(c => [c.slug, c.id]));

    // Initialize result tracking
    const result: ImportResult = {
      total: rawProducts.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      created: [],
      updated: [],
    };

    // Create import batch record
    const batch = await prisma.productImportBatch.create({
      data: {
        supplier_id: supplierId,
        source: 'API',
        total_rows: rawProducts.length,
        status: 'PROCESSING',
      },
    });

    // Process each product
    for (let i = 0; i < rawProducts.length; i++) {
      const rowNum = i + 1;
      const rawProduct = rawProducts[i];

      try {
        // Validate the product row
        const validation = productImportRowSchema.safeParse(rawProduct);
        if (!validation.success) {
          result.failed++;
          validation.error.issues.forEach(issue => {
            result.errors.push({
              row: rowNum,
              field: issue.path.join('.'),
              message: issue.message,
            });
          });
          continue;
        }

        const productData = validation.data;

        // Resolve category
        let categoryId = productData.category_id;
        if (!categoryId && productData.category_name) {
          categoryId = categoryMap.get(productData.category_name.toLowerCase()) ||
                       categorySlugMap.get(productData.category_name.toLowerCase());
        }
        if (!categoryId && defaultCategoryId) {
          categoryId = defaultCategoryId;
        }
        if (!categoryId) {
          // Use first category as fallback
          categoryId = categories[0]?.id;
          if (!categoryId) {
            result.failed++;
            result.errors.push({
              row: rowNum,
              message: 'No category found and no default category available',
            });
            continue;
          }
        }

        // Generate SKU: SupplierCode-SupplierSKU
        const generatedSku = `${supplier.code}-${productData.supplier_sku}`;

        // Calculate selling price with markup
        const sellingPrice = productData.supplier_price * (1 + markup / 100);

        // Check if product with this SKU already exists
        const existingProduct = await prisma.product.findUnique({
          where: { sku: generatedSku },
        });

        if (existingProduct) {
          if (updateExisting) {
            // Update existing product
            const updated = await prisma.product.update({
              where: { sku: generatedSku },
              data: {
                name: productData.name,
                description: productData.description || existingProduct.description,
                material: productData.material ?? existingProduct.material,
                diameter: productData.diameter ?? existingProduct.diameter,
                length: productData.length ?? existingProduct.length,
                strength_rating: productData.strength_rating ?? existingProduct.strength_rating,
                supplier_price: productData.supplier_price,
                price: sellingPrice,
                markup_percentage: markup,
                stock_status: productData.stock_status,
                image_url: productData.image_url ?? existingProduct.image_url,
                last_synced_at: new Date(),
              },
            });
            result.successful++;
            result.updated.push({ id: updated.id, name: updated.name, sku: updated.sku });
          } else {
            result.skipped++;
          }
        } else {
          // Create new product
          const created = await prisma.product.create({
            data: {
              name: productData.name,
              sku: generatedSku,
              description: productData.description || `${productData.name} from ${supplier.name}`,
              material: productData.material ?? null,
              diameter: productData.diameter ?? null,
              length: productData.length ?? null,
              strength_rating: productData.strength_rating ?? null,
              price: sellingPrice,
              supplier_price: productData.supplier_price,
              supplier_sku: productData.supplier_sku,
              markup_percentage: markup,
              is_third_party: true,
              supplier_id: supplierId,
              category_id: categoryId,
              stock_status: productData.stock_status,
              image_url: productData.image_url ?? null,
              last_synced_at: new Date(),
            },
          });
          result.successful++;
          result.created.push({ id: created.id, name: created.name, sku: created.sku });
        }
      } catch (err) {
        result.failed++;
        result.errors.push({
          row: rowNum,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Update batch record
    await prisma.productImportBatch.update({
      where: { id: batch.id },
      data: {
        processed_rows: result.total,
        successful: result.successful,
        failed: result.failed,
        skipped: result.skipped,
        status: 'COMPLETED',
        error_log: result.errors.length > 0 ? JSON.stringify(result.errors) : null,
        completed_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      ...result,
    });
  } catch (error) {
    logError('Error importing products:', error);
    return NextResponse.json(
      { error: 'Failed to import products' },
      { status: 500 }
    );
  }
}
