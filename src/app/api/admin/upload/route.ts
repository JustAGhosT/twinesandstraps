import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { requireAdminAuth } from '@/lib/admin-auth';

// Allowed file types and their MIME types
const ALLOWED_TYPES: Record<string, string[]> = {
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.webp': ['image/webp'],
  '.gif': ['image/gif'],
  '.svg': ['image/svg+xml'],
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTENSIONS = Object.keys(ALLOWED_TYPES);

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authError = requireAdminAuth(request);
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
          details: { size: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB` }
        },
        { status: 400 }
      );
    }

    // Validate file extension
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          details: { type: `Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}` }
        },
        { status: 400 }
      );
    }

    // Validate MIME type
    const allowedMimes = ALLOWED_TYPES[ext];
    if (!allowedMimes || !allowedMimes.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          details: { mime: 'File type does not match extension' }
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename with UUID to prevent collisions
    const uniqueId = uuidv4();
    const filename = `${uniqueId}${ext}`;

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Save file
    const filePath = path.join(uploadsDir, filename);
    await writeFile(filePath, buffer);

    // Return public URL
    const url = `/uploads/${filename}`;
    return NextResponse.json({
      url,
      filename,
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
