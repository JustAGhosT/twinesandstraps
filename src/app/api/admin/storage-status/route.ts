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

    // Build recommendation message
    let recommendation: string;
    if (status.configured) {
      recommendation = `Azure Blob Storage is properly configured. Images will be uploaded to container "${status.containerName}" in account "${status.accountName}". Note: Images are stored in the "products/" virtual folder within the container.`;
    } else if (status.isProduction) {
      recommendation = 'CRITICAL: Configure Azure Blob Storage in Netlify environment variables to enable image uploads.';
    } else {
      recommendation = 'Configure Azure Blob Storage before deploying to production.';
    }

    return NextResponse.json(
      successResponse({
        ...status,
        severity,
        recommendation,
        // Add explicit endpoint info when configured
        endpoint: status.configured && status.accountName 
          ? `https://${status.accountName}.blob.core.windows.net` 
          : null,
        uploadPath: status.configured 
          ? `${status.containerName}/products/` 
          : null,
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
