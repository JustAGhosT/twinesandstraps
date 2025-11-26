import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const product = await prisma.product.create({
      data: {
        name: body.name,
        sku: body.sku,
        description: body.description,
        material: body.material,
        diameter: body.diameter,
        length: body.length,
        strength_rating: body.strength_rating,
        price: body.price,
        vat_applicable: body.vat_applicable,
        stock_status: body.stock_status,
        image_url: body.image_url,
        category_id: body.category_id,
      },
      include: { category: true },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
