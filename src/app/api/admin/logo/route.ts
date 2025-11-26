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

/**
 * Sanitize SVG content by removing potentially dangerous elements.
 * Uses iterative approach to handle nested/repeated patterns.
 */
function sanitizeSvg(content: string): string {
  let sanitized = content;
  let previousLength: number;
  
  // Iterate until no more changes are made (handles nested patterns)
  do {
    previousLength = sanitized.length;
    
    // Remove script elements with flexible whitespace handling
    // Matches <script...>...</script> with any whitespace variations
    sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/\s*script\s*>/gi, '');
    // Also remove self-closing script tags
    sanitized = sanitized.replace(/<script[^>]*\/\s*>/gi, '');
    // Remove orphan script tags
    sanitized = sanitized.replace(/<\/?script[^>]*>/gi, '');
    
    // Remove on* event handlers - match attribute patterns more precisely
    // Handle quoted values
    sanitized = sanitized.replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, '');
    sanitized = sanitized.replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, '');
    // Handle unquoted values
    sanitized = sanitized.replace(/\s+on[a-z]+\s*=\s*[^\s>"']+/gi, '');
    
    // Remove javascript: protocol in any context
    sanitized = sanitized.replace(/javascript\s*:/gi, 'blocked:');
    
    // Remove potentially dangerous data: URIs
    // Block anything that's not an image type
    sanitized = sanitized.replace(/data\s*:\s*(?!image\/(?:png|jpeg|jpg|gif|webp|svg\+xml))[a-z/+]+/gi, 'data:text/plain');
    
    // Remove foreignObject elements (can contain arbitrary HTML)
    sanitized = sanitized.replace(/<foreignObject[^>]*>[\s\S]*?<\/\s*foreignObject\s*>/gi, '');
    sanitized = sanitized.replace(/<foreignObject[^>]*\/\s*>/gi, '');
    
    // Remove use elements with external references
    sanitized = sanitized.replace(/<use[^>]*href\s*=\s*["'](?!#)[^"']*["'][^>]*\/?>/gi, '');
    
    // Remove set elements (can modify attributes dynamically)
    sanitized = sanitized.replace(/<set[^>]*\/?>/gi, '');
    
    // Remove animate elements that target href attributes
    sanitized = sanitized.replace(/<animate[^>]*attributeName\s*=\s*["'](?:href|xlink:href)["'][^>]*\/?>/gi, '');
    
    // Remove iframe and object elements
    sanitized = sanitized.replace(/<iframe[^>]*>[\s\S]*?<\/\s*iframe\s*>/gi, '');
    sanitized = sanitized.replace(/<object[^>]*>[\s\S]*?<\/\s*object\s*>/gi, '');
    sanitized = sanitized.replace(/<embed[^>]*\/?>/gi, '');
    
  } while (sanitized.length !== previousLength);
  
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
    
    // Post-sanitization security check: reject if dangerous patterns remain
    // This is an additional safety layer in case the sanitization missed something
    const dangerousPatterns = [
      /<script/i,
      /\son[a-z]+\s*=/i,
      /javascript\s*:/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /<foreignObject/i,
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(sanitizedContent)) {
        return NextResponse.json(
          {
            error: 'SVG contains potentially unsafe content',
            details: { security: 'The SVG file contains elements that are not allowed for security reasons' }
          },
          { status: 400 }
        );
      }
    }

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
