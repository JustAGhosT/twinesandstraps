import prisma from '@/lib/prisma';

export type ActivityAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'LOGIN'
  | 'LOGOUT'
  | 'APPROVE'
  | 'REJECT'
  | 'SHIP'
  | 'DELIVER'
  | 'CANCEL'
  | 'REFUND'
  | 'UPLOAD'
  | 'EXPORT';

export type EntityType =
  | 'PRODUCT'
  | 'ORDER'
  | 'CUSTOMER'
  | 'CATEGORY'
  | 'REVIEW'
  | 'TESTIMONIAL'
  | 'SETTINGS'
  | 'THEME'
  | 'FEATURE'
  | 'ADMIN'
  | 'LOGO';

interface LogActivityParams {
  action: ActivityAction;
  entityType: EntityType;
  entityId?: number;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Log an admin activity to the database
 */
export async function logActivity({
  action,
  entityType,
  entityId,
  description,
  metadata,
  ipAddress,
  userAgent,
}: LogActivityParams): Promise<void> {
  try {
    await prisma.adminActivityLog.create({
      data: {
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
      },
    });
  } catch (error) {
    // Log error but don't throw - activity logging should not break the main operation
    console.error('Failed to log activity:', error);
  }
}

/**
 * Helper to extract request info for logging
 */
export function getRequestInfo(request: Request): { ipAddress: string | null; userAgent: string | null } {
  const headers = request.headers;
  return {
    ipAddress: headers.get('x-forwarded-for') || headers.get('x-real-ip') || null,
    userAgent: headers.get('user-agent') || null,
  };
}
