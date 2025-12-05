import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/admin-auth';
import { updateSupplierSchema, validateBody, formatZodErrors } from '@/lib/validations';
import { requireCsrfToken } from '@/lib/security/csrf';
import { withRateLimit, getRateLimitConfig } from '@/lib/security/rate-limit-wrapper';

interface RouteParams {
  params: { id: string };
}

// GET - Get single supplier by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const id = parseInt(params.id);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid supplier ID' }, { status: 400 });
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            sku: true,
            supplier_sku: true,
            price: true,
            supplier_price: true,
            stock_status: true,
          },
          take: 10,
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier' },
      { status: 500 }
    );
  }
}

// PUT - Update supplier
async function handlePUT(request: NextRequest, { params }: RouteParams) {
  // Verify CSRF token
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const id = parseInt(params.id);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid supplier ID' }, { status: 400 });
    }

    const body = await request.json();
    const validation = validateBody(updateSupplierSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodErrors(validation.errors) },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if supplier exists
    const existing = await prisma.supplier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Check for duplicate code if code is being changed
    if (data.code && data.code !== existing.code) {
      const existingCode = await prisma.supplier.findUnique({
        where: { code: data.code },
      });
      if (existingCode) {
        return NextResponse.json(
          { error: 'Duplicate code', details: { code: 'A supplier with this code already exists' } },
          { status: 409 }
        );
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.contact_name !== undefined && { contact_name: data.contact_name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.default_markup !== undefined && { default_markup: data.default_markup }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
        ...(data.payment_terms !== undefined && { payment_terms: data.payment_terms }),
        ...(data.lead_time_days !== undefined && { lead_time_days: data.lead_time_days }),
        ...(data.min_order_value !== undefined && { min_order_value: data.min_order_value }),
      },
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 }
    );
  }
}

// DELETE - Delete supplier (soft delete by deactivating, or hard delete if no products)
async function handleDELETE(request: NextRequest, { params }: RouteParams) {
  // Verify CSRF token
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const id = parseInt(params.id);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid supplier ID' }, { status: 400 });
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // If supplier has products, soft delete by deactivating
    if (supplier._count.products > 0) {
      await prisma.supplier.update({
        where: { id },
        data: { is_active: false },
      });
      return NextResponse.json({
        message: 'Supplier deactivated (has associated products)',
        deactivated: true,
      });
    }

    // Otherwise, hard delete
    await prisma.supplier.delete({ where: { id } });
    return NextResponse.json({ message: 'Supplier deleted', deleted: true });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    );
  }
}

export const PUT = withRateLimit(handlePUT, getRateLimitConfig('admin'));
export const DELETE = withRateLimit(handleDELETE, getRateLimitConfig('admin'));
