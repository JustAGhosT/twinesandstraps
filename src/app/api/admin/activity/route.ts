import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

// Constants for input validation
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

// Helper to validate date strings
function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return isFinite(date.getTime());
}

// GET - Fetch activity logs with pagination and filters
export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    
    // Parse and validate page
    const rawPage = Number(searchParams.get('page') || '1');
    const page = Math.max(1, Math.floor(isNaN(rawPage) ? 1 : rawPage));
    
    // Parse and validate limit
    const rawLimit = Number(searchParams.get('limit') || String(DEFAULT_LIMIT));
    const limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(isNaN(rawLimit) ? DEFAULT_LIMIT : rawLimit)));
    
    const entityType = searchParams.get('entity_type');
    const action = searchParams.get('action');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Validate date parameters if provided
    if (startDate && !isValidDate(startDate)) {
      return NextResponse.json(
        { error: 'Invalid start_date format. Use ISO 8601 format.' },
        { status: 400 }
      );
    }
    if (endDate && !isValidDate(endDate)) {
      return NextResponse.json(
        { error: 'Invalid end_date format. Use ISO 8601 format.' },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      entity_type?: string;
      action?: string;
      created_at?: { gte?: Date; lte?: Date };
    } = {};

    if (entityType) where.entity_type = entityType;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = new Date(startDate);
      if (endDate) where.created_at.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.adminActivityLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.adminActivityLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}

// POST - Create a new activity log entry (internal use)
export async function POST(request: NextRequest) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { action, entity_type, entity_id, description, metadata } = body;

    if (!action || !entity_type || !description) {
      return NextResponse.json(
        { error: 'action, entity_type, and description are required' },
        { status: 400 }
      );
    }

    const log = await prisma.adminActivityLog.create({
      data: {
        action,
        entity_type,
        entity_id: entity_id || null,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
      },
    });

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error('Error creating activity log:', error);
    return NextResponse.json(
      { error: 'Failed to create activity log' },
      { status: 500 }
    );
  }
}
