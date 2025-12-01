import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';

// Allowed MIME types for image uploads with display names
// Note: SVG is intentionally excluded due to XSS risks (can contain embedded JavaScript)
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/gif': 'GIF',
};

// Maximum file size for base64 storage (2MB to keep database entries reasonable)
// Base64 encoding increases size by ~33%, so 2MB file becomes ~2.67MB in storage.
// Additional overhead from database storage and JSON encoding may increase total storage further.
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: 'File too large',
          details: { 
            size: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB. Please resize or compress your image.` 
          }
        },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!Object.keys(ALLOWED_MIME_TYPES).includes(file.type)) {
      const allowedTypeNames = Object.values(ALLOWED_MIME_TYPES).join(', ');
      return NextResponse.json(
        {
          error: 'Invalid file type',
          details: { 
            type: `Allowed types: ${allowedTypeNames}` 
          }
        },
        { status: 400 }
      );
    }

    // Convert file to base64 data URL for database storage
    // This ensures images persist in serverless environments where filesystem is ephemeral
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Return data URL that can be stored directly in the database
    return NextResponse.json({
      url: dataUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file. Please try again.' },
      { status: 500 }
    );
  }
}
