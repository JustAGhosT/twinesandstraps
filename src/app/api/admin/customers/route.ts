import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/admin-auth';

interface CustomerResult {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  marketing_consent: boolean;
  created_at: Date;
  last_login: Date | null;
  _count: {
    orders: number;
    addresses: number;
  };
}

export async function GET(request: NextRequest) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          marketing_consent: true,
          created_at: true,
          last_login: true,
          _count: {
            select: {
              orders: true,
              addresses: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Get customer IDs for the batch query
    const customerIds = (customers as CustomerResult[]).map(c => c.id);

    // Batch query to get total spent for all customers at once (fixes N+1 query)
    const orderTotals = await prisma.order.groupBy({
      by: ['user_id'],
      where: {
        user_id: { in: customerIds },
        status: { not: 'CANCELLED' },
      },
      _sum: { total: true },
    });

    // Create a map for quick lookup
    const totalSpentMap = new Map(
      orderTotals.map(ot => [ot.user_id, ot._sum.total || 0])
    );

    // Merge totals with customer data
    const customersWithStats = (customers as CustomerResult[]).map(customer => ({
      ...customer,
      total_spent: totalSpentMap.get(customer.id) || 0,
    }));

    return NextResponse.json({
      customers: customersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
