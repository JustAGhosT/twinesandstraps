import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/user-auth';

// Get user's view history
export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const viewHistory = await prisma.viewHistory.findMany({
      where: { user_id: user.userId },
      include: {
        product: {
          include: { category: true },
        },
      },
      orderBy: { viewed_at: 'desc' },
      take: Math.min(limit, 50),
    });

    return NextResponse.json({
      items: viewHistory.map((vh: typeof viewHistory[number]) => ({
        id: vh.id,
        viewed_at: vh.viewed_at,
        product: vh.product,
      })),
    });
  } catch (error) {
    console.error('Error fetching view history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch view history' },
      { status: 500 }
    );
  }
}

// Add product to view history
export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { productId } = await request.json();

    if (!productId || typeof productId !== 'number') {
      return NextResponse.json(
        { error: 'Valid product ID is required' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Upsert view history - update timestamp if exists, create if not
    const viewHistory = await prisma.viewHistory.upsert({
      where: {
        user_id_product_id: {
          user_id: user.userId,
          product_id: productId,
        },
      },
      update: {
        viewed_at: new Date(),
      },
      create: {
        user_id: user.userId,
        product_id: productId,
      },
    });

    return NextResponse.json({ success: true, id: viewHistory.id });
  } catch (error) {
    console.error('Error recording view:', error);
    return NextResponse.json(
      { error: 'Failed to record view' },
      { status: 500 }
    );
  }
}

// Clear view history
export async function DELETE(request: NextRequest) {
  const user = getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    await prisma.viewHistory.deleteMany({
      where: { user_id: user.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing view history:', error);
    return NextResponse.json(
      { error: 'Failed to clear view history' },
      { status: 500 }
    );
  }
}
