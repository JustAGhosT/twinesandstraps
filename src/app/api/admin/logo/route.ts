import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { requireAdminAuth } from '@/lib/admin-auth';

// Only allow SVG format for logos
const ALLOWED_MIME_TYPE = 'image/svg+xml';
const MAX_FILE_SIZE = 512 * 1024; // 512KB - SVGs should be small
const LOGO_FILENAME = 'logo.svg';
const LOGO_DIR = path.join(process.cwd(), 'public');

// Basic SVG validation to ensure it's a valid SVG
function isValidSvg(content: string): boolean {
  const trimmed = content.trim();
  // Check if it starts with XML declaration or SVG element
  const hasXmlOrSvg = trimmed.startsWith('<?xml') || trimmed.startsWith('<svg');
  // Check if it contains an svg element
  const hasSvgElement = /<svg[\s>]/i.test(trimmed) && /<\/svg>/i.test(trimmed);
  return hasXmlOrSvg && hasSvgElement;
}

// Sanitize SVG content to remove potentially dangerous elements
function sanitizeSvg(content: string): string {
  // Remove script tags and their content
  let sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove on* event handlers (onclick, onload, etc.)
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  
  // Remove potentially dangerous data: URIs (allow only safe image formats)
  // Block text/html, application/javascript, text/javascript, etc.
  sanitized = sanitized.replace(/data\s*:\s*(?!image\/(?:png|jpeg|jpg|gif|webp|svg\+xml))[^"'\s)]+/gi, 'data:text/plain');
  
  // Remove foreignObject elements (can contain HTML)
  sanitized = sanitized.replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '');
  
  // Remove use elements with external references (potential XSS vector)
  sanitized = sanitized.replace(/<use[^>]*xlink:href\s*=\s*["'](?!#)[^"']*["'][^>]*>/gi, '');
  
  // Remove set and animate elements that could manipulate attributes dangerously
  sanitized = sanitized.replace(/<set\b[^>]*>/gi, '');
  sanitized = sanitized.replace(/<animate\b[^>]*attributeName\s*=\s*["'](?:href|xlink:href)["'][^>]*>/gi, '');
  
  return sanitized;
}

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authError = requireAdminAuth(request);
  if (authError) return authError;

  try {
    const logoPath = path.join(LOGO_DIR, LOGO_FILENAME);
    await readFile(logoPath);
    return NextResponse.json({ 
      hasLogo: true, 
      url: `/${LOGO_FILENAME}` 
    });
  } catch {
    return NextResponse.json({ 
      hasLogo: false, 
      url: null 
    });
  }
}

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
          details: { size: `Maximum file size is ${MAX_FILE_SIZE / 1024}KB` }
        },
        { status: 400 }
      );
    }

    // Validate file extension
    const ext = path.extname(file.name).toLowerCase();
    if (ext !== '.svg') {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          details: { type: 'Only SVG files are allowed for logos' }
        },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (file.type !== ALLOWED_MIME_TYPE) {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          details: { mime: 'File must be an SVG image (image/svg+xml)' }
        },
        { status: 400 }
      );
    }

    // Read file content as text for SVG validation and sanitization
    const content = await file.text();

    // Validate SVG structure
    if (!isValidSvg(content)) {
      return NextResponse.json(
        {
          error: 'Invalid SVG file',
          details: { format: 'The file does not appear to be a valid SVG' }
        },
        { status: 400 }
      );
    }

    // Sanitize SVG content
    const sanitizedContent = sanitizeSvg(content);

    // Ensure directory exists
    await mkdir(LOGO_DIR, { recursive: true });

    // Save the sanitized SVG
    const logoPath = path.join(LOGO_DIR, LOGO_FILENAME);
    await writeFile(logoPath, sanitizedContent, 'utf-8');

    return NextResponse.json({
      success: true,
      url: `/${LOGO_FILENAME}`,
      message: 'Logo uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { error: 'Failed to upload logo. Please try again.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Verify admin authentication
  const authError = requireAdminAuth(request);
  if (authError) return authError;

  try {
    const logoPath = path.join(LOGO_DIR, LOGO_FILENAME);
    await unlink(logoPath);
    
    return NextResponse.json({
      success: true,
      message: 'Logo removed successfully'
    });
  } catch (error) {
    // If file doesn't exist, that's okay
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({
        success: true,
        message: 'No logo to remove'
      });
    }
    
    console.error('Error removing logo:', error);
    return NextResponse.json(
      { error: 'Failed to remove logo. Please try again.' },
      { status: 500 }
    );
  }
}
