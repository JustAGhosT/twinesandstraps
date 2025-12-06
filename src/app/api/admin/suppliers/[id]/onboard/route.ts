/**
 * Supplier Onboarding API
 * Tracks supplier onboarding steps and logs to AdminActivityLog
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { requireCsrfToken } from '@/lib/security/csrf';
import { getRateLimitConfig, withRateLimit } from '@/lib/security/rate-limit-wrapper';
import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';
import { z } from 'zod';

const onboardingStepSchema = z.object({
  step: z.enum([
    'setup',
    'configure',
    'product_mapping',
    'testing',
    'activated',
    'failed',
  ]),
  notes: z.string().optional(),
  providerType: z.enum(['manual', 'api', 'csv', 'edi']).optional(),
  apiConfigured: z.boolean().optional(),
  productsMapped: z.number().optional(),
  testResults: z.record(z.any()).optional(),
});

async function handlePOST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const supplierId = parseInt(params.id);
    if (isNaN(supplierId)) {
      return NextResponse.json({ error: 'Invalid supplier ID' }, { status: 400 });
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = onboardingStepSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Update supplier with onboarding progress
    const updateData: any = {};
    if (data.providerType) {
      updateData.provider_type = data.providerType;
    }

    await prisma.supplier.update({
      where: { id: supplierId },
      data: updateData,
    });

    // Log onboarding step to AdminActivityLog
    const stepDescriptions: Record<string, string> = {
      setup: 'Supplier onboarding started',
      configure: 'Supplier configuration in progress',
      product_mapping: 'Product mapping completed',
      testing: 'Integration testing completed',
      activated: 'Supplier integration activated',
      failed: 'Supplier onboarding failed',
    };

    const metadata = {
      step: data.step,
      notes: data.notes,
      providerType: data.providerType,
      apiConfigured: data.apiConfigured,
      productsMapped: data.productsMapped,
      testResults: data.testResults,
    };

    await logActivity({
      action: 'SUPPLIER_ONBOARDING',
      entityType: 'SUPPLIER',
      entityId: supplierId,
      description: `${stepDescriptions[data.step]}: ${supplier.name}`,
      metadata: JSON.stringify(metadata),
    });

    return NextResponse.json({
      success: true,
      step: data.step,
      message: stepDescriptions[data.step],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get onboarding progress for a supplier
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const supplierId = parseInt(params.id);
    if (isNaN(supplierId)) {
      return NextResponse.json({ error: 'Invalid supplier ID' }, { status: 400 });
    }

    // Get onboarding logs from AdminActivityLog
    const logs = await prisma.adminActivityLog.findMany({
      where: {
        entity_type: 'SUPPLIER',
        entity_id: supplierId,
        action: 'SUPPLIER_ONBOARDING',
      },
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    const progress = logs.map(log => {
      const metadata = log.metadata ? JSON.parse(log.metadata) : {};
      return {
        step: metadata.step,
        timestamp: log.created_at,
        notes: metadata.notes,
        providerType: metadata.providerType,
        apiConfigured: metadata.apiConfigured,
        productsMapped: metadata.productsMapped,
        description: log.description,
      };
    });

    return NextResponse.json({
      supplierId,
      progress,
      currentStep: progress[0]?.step || 'setup',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(handleGET, getRateLimitConfig('admin'));
export const POST = withRateLimit(handlePOST, getRateLimitConfig('admin'));

