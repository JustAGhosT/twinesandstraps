import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { uploadFile, isBlobStorageConfigured } from '@/lib/blob-storage';
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
// - 5MB when using blob storage
// - 2MB when using base64 (to keep database entries reasonable)
const MAX_FILE_SIZE_BLOB = 5 * 1024 * 1024; // 5MB
const MAX_FILE_SIZE_BASE64 = 2 * 1024 * 1024; // 2MB

export async function POST(request: NextRequest) {
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

    // Upload file using blob storage or fallback to base64
    const result = await uploadFile(file, { folder: 'products' });

    const uploadData: UploadData = {
      url: result.url,
      filename: result.filename,
      size: result.size,
      type: result.type,
    };

    return NextResponse.json(
      successResponse(uploadData, `File uploaded successfully${result.storageType === 'base64' ? ' (stored as base64)' : ''}`)
    );
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      errorResponse('Failed to upload file. Please try again.'),
      { status: 500 }
    );
  }
}
