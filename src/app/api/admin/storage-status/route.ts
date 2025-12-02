import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { getStorageStatus } from '@/lib/blob-storage';
import { successResponse, errorResponse } from '@/types/api';

/**
 * GET /api/admin/storage-status
 * 
 * Returns the current storage configuration status.
 * This endpoint helps admins diagnose why images might be stored as base64
 * instead of being uploaded to Azure Blob Storage.
 */
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const status = getStorageStatus();
    
    // Determine severity level for UI display
    let severity: 'success' | 'warning' | 'error';
    if (status.configured) {
      severity = 'success';
    } else if (status.isProduction) {
      severity = 'error';
    } else {
      severity = 'warning';
    }

    return NextResponse.json(
      successResponse({
        ...status,
        severity,
        recommendation: status.configured 
          ? 'Azure Blob Storage is properly configured. Images will be stored in Azure.'
          : status.isProduction
            ? 'CRITICAL: Configure Azure Blob Storage in Netlify environment variables to enable image uploads.'
            : 'Configure Azure Blob Storage before deploying to production.',
      })
    );
  } catch (error) {
    console.error('Error getting storage status:', error);
    return NextResponse.json(
      errorResponse('Failed to get storage status'),
      { status: 500 }
    );
  }
}
