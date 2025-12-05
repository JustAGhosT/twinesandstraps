import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { uploadFile, isBlobStorageConfigured, getStorageStatus } from '@/lib/blob-storage';
import { requireCsrfToken } from '@/lib/security/csrf';
import { withRateLimit, getRateLimitConfig } from '@/lib/security/rate-limit-wrapper';
import type { UploadData } from '@/types/api';
import { successResponse, errorResponse } from '@/types/api';

// Allowed MIME types for image uploads with display names
// Note: SVG is intentionally excluded due to XSS risks (can contain embedded JavaScript)
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/gif': 'GIF',
};

// Maximum file size:
// - 5MB when using blob storage (required for production)
// - 2MB when using base64 (development fallback only)
const MAX_FILE_SIZE_BLOB = 5 * 1024 * 1024; // 5MB
const MAX_FILE_SIZE_BASE64 = 2 * 1024 * 1024; // 2MB

async function handlePOST(request: NextRequest) {
  // Verify CSRF token
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  // Verify admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        errorResponse('No file provided'),
        { status: 400 }
      );
    }

    // Determine max file size based on storage type
    const useBlobStorage = isBlobStorageConfigured();
    const maxFileSize = useBlobStorage ? MAX_FILE_SIZE_BLOB : MAX_FILE_SIZE_BASE64;

    // Validate file size
    if (file.size > maxFileSize) {
      return NextResponse.json(
        errorResponse('File too large', { 
          size: `Maximum file size is ${maxFileSize / 1024 / 1024}MB. Please resize or compress your image.` 
        }),
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!Object.keys(ALLOWED_MIME_TYPES).includes(file.type)) {
      const allowedTypeNames = Object.values(ALLOWED_MIME_TYPES).join(', ');
      return NextResponse.json(
        errorResponse('Invalid file type', { 
          type: `Allowed types: ${allowedTypeNames}` 
        }),
        { status: 400 }
      );
    }

    // Upload file using Azure Blob Storage (required in production)
    const result = await uploadFile(file, { folder: 'products' });

    const uploadData: UploadData = {
      url: result.url,
      filename: result.filename,
      size: result.size,
      type: result.type,
    };

    // Warn in response if using base64 fallback (development only)
    const message = result.storageType === 'base64' 
      ? 'File uploaded as base64 (development mode only - configure Azure Blob Storage for production)'
      : `File uploaded successfully to Azure Blob Storage (container: ${result.containerName})`;

    return NextResponse.json(
      successResponse(uploadData, message)
    );
  } catch (error) {
    console.error('Error uploading file:', error);
    
    // Provide a more helpful error message for Azure configuration issues
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isConfigError = errorMessage.includes('Azure Blob Storage is required');
    
    if (isConfigError) {
      const status = getStorageStatus();
      return NextResponse.json(
        errorResponse(
          'Azure Blob Storage configuration required for image uploads',
          { 
            configuration: errorMessage,
            missing: status.missingVariables.join(', '),
            help: 'Please configure Azure Blob Storage environment variables in Azure App Service. See docs/getting-started/setup.md for detailed setup instructions.',
            setupGuide: 'docs/getting-started/setup.md#azure-blob-storage-required-for-production'
          }
        ),
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      errorResponse('Failed to upload file. Please try again.', 
        process.env.NODE_ENV === 'development' ? { details: errorMessage } : undefined
      ),
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handlePOST, getRateLimitConfig('admin'));
